import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { isValidEmail, normalizeEmail, unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
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
    return unauthorizedResponse()
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
      return badRequestResponse('No contacts to import')
    }

    // Create any new tags first (batch operation)
    const newTagNames = newTags.filter(t => t.name?.trim()).map(t => t.name.trim())

    // Batch fetch existing tags by name
    const existingTags = newTagNames.length > 0
      ? await prisma.tag.findMany({
          where: { name: { in: newTagNames } },
          select: { id: true, name: true },
        })
      : []
    const existingTagMap = new Map(existingTags.map(t => [t.name, t.id]))

    // Create missing tags
    const tagsToCreate = newTags.filter(t => t.name?.trim() && !existingTagMap.has(t.name.trim()))
    if (tagsToCreate.length > 0) {
      await prisma.tag.createMany({
        data: tagsToCreate.map(t => ({
          name: t.name.trim(),
          color: t.color || '#8B5CF6',
        })),
        skipDuplicates: true,
      })
    }

    // Fetch all tag IDs (existing + newly created)
    const allNewTagNames = newTags.filter(t => t.name?.trim()).map(t => t.name.trim())
    const createdTags = allNewTagNames.length > 0
      ? await prisma.tag.findMany({
          where: { name: { in: allNewTagNames } },
          select: { id: true },
        })
      : []
    const createdTagIds = createdTags.map(t => t.id)

    // Combine existing tag IDs with newly created ones (deduplicated)
    const allTagIds = Array.from(new Set([...tagIds, ...createdTagIds]))

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as { row: number; email: string; error: string }[],
    }

    // Pre-validate and normalize all emails
    const validContacts: { index: number; email: string; contact: ImportContact }[] = []
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      if (!contact.email) {
        results.failed++
        results.errors.push({ row: i + 1, email: '', error: 'Email is required' })
        continue
      }

      const email = normalizeEmail(contact.email)

      if (!isValidEmail(email)) {
        results.failed++
        results.errors.push({ row: i + 1, email: contact.email, error: 'Invalid email format' })
        continue
      }

      validContacts.push({ index: i, email, contact })
    }

    // Batch fetch all existing contacts by email (single query instead of O(n))
    const emailsToCheck = validContacts.map(c => c.email)
    const existingContacts = await prisma.contact.findMany({
      where: { email: { in: emailsToCheck } },
      include: { tags: true },
    })
    const existingContactMap = new Map(existingContacts.map(c => [c.email, c]))

    // Process each valid contact
    for (const { index, email, contact } of validContacts) {
      try {
        const existing = existingContactMap.get(email)

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
          row: index + 1,
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

    return successResponse({
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
    logger.error('Import failed:', error)
    return errorResponse('Import failed')
  }
}
