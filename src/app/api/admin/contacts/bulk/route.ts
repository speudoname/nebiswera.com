import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { ContactStatus } from '@prisma/client'

interface BulkOperation {
  contactIds: string[]
  action: 'addTags' | 'removeTags' | 'changeStatus' | 'delete'
  tagIds?: string[]
  status?: ContactStatus
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as BulkOperation
    const { contactIds, action, tagIds, status } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
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

        // Add tags to all selected contacts
        for (const contactId of contactIds) {
          await prisma.contactTag.createMany({
            data: tagIds.map(tagId => ({
              contactId,
              tagId,
            })),
            skipDuplicates: true,
          })
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

        const updateResult = await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: { status },
        })
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
