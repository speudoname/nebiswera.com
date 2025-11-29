import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { logTagsAdded, logTagsRemoved, logStatusChanged } from '@/app/api/admin/contacts/lib/contact-activity'
import type { NextRequest } from 'next/server'
import type { ContactStatus, Prisma } from '@prisma/client'

interface BulkFilters {
  search?: string
  status?: string
  source?: string
  tagId?: string
}

interface BulkOperation {
  contactIds?: string[]
  selectAllMatching?: boolean
  filters?: BulkFilters
  action: 'addTags' | 'removeTags' | 'changeStatus' | 'delete'
  tagIds?: string[]
  status?: ContactStatus
}

// Build where clause from filters (same logic as contacts GET)
function buildWhereClause(filters: BulkFilters): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {}

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status as ContactStatus
  }

  if (filters.source && filters.source !== 'all') {
    where.source = filters.source
  }

  if (filters.tagId) {
    where.tags = {
      some: { tagId: filters.tagId },
    }
  }

  return where
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json() as BulkOperation
    const { contactIds: providedIds, selectAllMatching, filters, action, tagIds, status } = body

    // Determine contact IDs to operate on
    let contactIds: string[] = []

    if (selectAllMatching && filters) {
      // Fetch all matching contact IDs based on filters
      const where = buildWhereClause(filters)
      const matchingContacts = await prisma.contact.findMany({
        where,
        select: { id: true },
      })
      contactIds = matchingContacts.map(c => c.id)
    } else if (providedIds && Array.isArray(providedIds)) {
      contactIds = providedIds
    }

    if (contactIds.length === 0) {
      return NextResponse.json(
        { error: 'No contacts selected' },
        { status: 400 }
      )
    }

    let affected = 0

    switch (action) {
      case 'addTags':
        if (!tagIds || tagIds.length === 0) {
          return NextResponse.json(
            { error: 'No tags specified' },
            { status: 400 }
          )
        }

        // Get tag names for logging
        const tagsToAdd = await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { name: true },
        })
        const tagNamesToAdd = tagsToAdd.map((t) => t.name)

        // Add tags to all selected contacts
        for (const contactId of contactIds) {
          await prisma.contactTag.createMany({
            data: tagIds.map(tagId => ({
              contactId,
              tagId,
            })),
            skipDuplicates: true,
          })
          await logTagsAdded(contactId, tagNamesToAdd, token?.sub)
        }
        affected = contactIds.length
        break

      case 'removeTags':
        if (!tagIds || tagIds.length === 0) {
          return NextResponse.json(
            { error: 'No tags specified' },
            { status: 400 }
          )
        }

        // Get tag names for logging
        const tagsToRemove = await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { name: true },
        })
        const tagNamesToRemove = tagsToRemove.map((t) => t.name)

        // Log before removing
        for (const contactId of contactIds) {
          await logTagsRemoved(contactId, tagNamesToRemove, token?.sub)
        }

        // Remove tags from all selected contacts
        const deleteResult = await prisma.contactTag.deleteMany({
          where: {
            contactId: { in: contactIds },
            tagId: { in: tagIds },
          },
        })
        affected = deleteResult.count
        break

      case 'changeStatus':
        if (!status) {
          return NextResponse.json(
            { error: 'No status specified' },
            { status: 400 }
          )
        }

        // Get current statuses for logging
        const contactsToUpdate = await prisma.contact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true, status: true },
        })

        const updateResult = await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: { status },
        })

        // Log status changes
        for (const contact of contactsToUpdate) {
          if (contact.status !== status) {
            await logStatusChanged(contact.id, contact.status, status, token?.sub)
          }
        }
        affected = updateResult.count
        break

      case 'delete':
        const deleteContactsResult = await prisma.contact.deleteMany({
          where: { id: { in: contactIds } },
        })
        affected = deleteContactsResult.count
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      affected,
      action,
    })
  } catch (error) {
    console.error('Bulk operation failed:', error)
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    )
  }
}
