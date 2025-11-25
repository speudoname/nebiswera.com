import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { UpdateStrategy } from '@prisma/client'

interface ImportContact {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  source?: string
  sourceDetails?: string
  notes?: string
}

interface ImportOptions {
  contacts: ImportContact[]
  source: string
  sourceDetails?: string
  fileName: string
  updateStrategy: UpdateStrategy
  tagIds: string[]
  newTags: { name: string; color: string }[]
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json() as ImportOptions
    const {
      contacts,
      source,
      sourceDetails,
      fileName,
      updateStrategy = 'SKIP_EXISTING',
      tagIds = [],
      newTags = [],
    } = body

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts to import' },
        { status: 400 }
      )
    }

    // Create any new tags first
    const createdTagIds: string[] = []
    for (const newTag of newTags) {
      if (newTag.name?.trim()) {
        const existing = await prisma.tag.findUnique({
          where: { name: newTag.name.trim() },
        })
        if (existing) {
          createdTagIds.push(existing.id)
        } else {
          const created = await prisma.tag.create({
            data: {
              name: newTag.name.trim(),
              color: newTag.color || '#8B5CF6',
            },
          })
          createdTagIds.push(created.id)
        }
      }
    }

    // Combine existing tag IDs with newly created ones (deduplicated)
    const allTagIds = Array.from(new Set([...tagIds, ...createdTagIds]))

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as { row: number; email: string; error: string }[],
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      if (!contact.email) {
        results.failed++
        results.errors.push({
          row: i + 1,
          email: '',
          error: 'Email is required',
        })
        continue
      }

      const email = contact.email.toLowerCase().trim()

      if (!emailRegex.test(email)) {
        results.failed++
        results.errors.push({
          row: i + 1,
          email: contact.email,
          error: 'Invalid email format',
        })
        continue
      }

      try {
        const existing = await prisma.contact.findUnique({
          where: { email },
          include: { tags: true },
        })

        if (existing) {
          // Handle existing contact based on strategy
          switch (updateStrategy) {
            case 'SKIP_EXISTING':
              results.skipped++
              continue

            case 'ADD_TAGS_ONLY':
              // Only add tags, don't update other fields
              if (allTagIds.length > 0) {
                const existingTagIds = existing.tags.map(t => t.tagId)
                const newTagsToAdd = allTagIds.filter(id => !existingTagIds.includes(id))

                if (newTagsToAdd.length > 0) {
                  await prisma.contactTag.createMany({
                    data: newTagsToAdd.map(tagId => ({
                      contactId: existing.id,
                      tagId,
                    })),
                    skipDuplicates: true,
                  })
                }
              }
              results.updated++
              continue

            case 'UPDATE_EMPTY_ONLY':
              // Only fill in empty fields
              const updateData: Record<string, string | null> = {}
              if (!existing.firstName && contact.firstName?.trim()) {
                updateData.firstName = contact.firstName.trim()
              }
              if (!existing.lastName && contact.lastName?.trim()) {
                updateData.lastName = contact.lastName.trim()
              }
              if (!existing.phone && contact.phone?.trim()) {
                updateData.phone = contact.phone.trim()
              }
              if (!existing.notes && contact.notes?.trim()) {
                updateData.notes = contact.notes.trim()
              }

              if (Object.keys(updateData).length > 0) {
                await prisma.contact.update({
                  where: { id: existing.id },
                  data: updateData,
                })
              }

              // Add new tags
              if (allTagIds.length > 0) {
                const existingTagIds = existing.tags.map(t => t.tagId)
                const newTagsToAdd = allTagIds.filter(id => !existingTagIds.includes(id))

                if (newTagsToAdd.length > 0) {
                  await prisma.contactTag.createMany({
                    data: newTagsToAdd.map(tagId => ({
                      contactId: existing.id,
                      tagId,
                    })),
                    skipDuplicates: true,
                  })
                }
              }
              results.updated++
              continue

            case 'OVERWRITE_ALL':
              // Replace all data
              await prisma.contact.update({
                where: { id: existing.id },
                data: {
                  firstName: contact.firstName?.trim() || null,
                  lastName: contact.lastName?.trim() || null,
                  phone: contact.phone?.trim() || null,
                  source: contact.source || source || 'import',
                  sourceDetails: contact.sourceDetails || sourceDetails || fileName,
                  notes: contact.notes?.trim() || null,
                },
              })

              // Replace tags (remove old, add new)
              if (allTagIds.length > 0) {
                // Remove all existing tags
                await prisma.contactTag.deleteMany({
                  where: { contactId: existing.id },
                })
                // Add new tags
                await prisma.contactTag.createMany({
                  data: allTagIds.map(tagId => ({
                    contactId: existing.id,
                    tagId,
                  })),
                })
              }
              results.updated++
              continue
          }
        } else {
          // Create new contact
          const newContact = await prisma.contact.create({
            data: {
              email,
              firstName: contact.firstName?.trim() || null,
              lastName: contact.lastName?.trim() || null,
              phone: contact.phone?.trim() || null,
              source: contact.source || source || 'import',
              sourceDetails: contact.sourceDetails || sourceDetails || fileName,
              notes: contact.notes?.trim() || null,
            },
          })

          // Add tags
          if (allTagIds.length > 0) {
            await prisma.contactTag.createMany({
              data: allTagIds.map(tagId => ({
                contactId: newContact.id,
                tagId,
              })),
            })
          }

          results.created++
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          row: i + 1,
          email: contact.email,
          error: 'Database error',
        })
      }
    }

    // Log the import
    await prisma.importLog.create({
      data: {
        fileName,
        totalRows: contacts.length,
        successCount: results.created,
        updatedCount: results.updated,
        skippedCount: results.skipped,
        failedCount: results.failed,
        updateStrategy,
        tagsApplied: allTagIds,
        errors: results.errors.length > 0 ? results.errors : undefined,
        importedBy: token?.sub || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      results: {
        total: contacts.length,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
        errors: results.errors.slice(0, 50),
      },
    })
  } catch (error) {
    console.error('Import failed:', error)
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    )
  }
}
