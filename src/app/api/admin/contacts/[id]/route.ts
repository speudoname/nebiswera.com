import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { logContactUpdated, logStatusChanged, logTagsAdded, logTagsRemoved } from '@/app/api/admin/contacts/lib/contact-activity'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!contact) {
    return notFoundResponse('Contact not found')
  }

  return NextResponse.json({
    ...contact,
    tags: contact.tags.map((ct) => ct.tag),
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { email, firstName, lastName, phone, source, sourceDetails, status, notes, tagIds } = body

    // Check if contact exists with tags
    const existingContact = await prisma.contact.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    })

    if (!existingContact) {
      return notFoundResponse('Contact not found')
    }

    // Check if email is being changed and already exists
    if (email && email !== existingContact.email) {
      const emailExists = await prisma.contact.findUnique({
        where: { email },
      })
      if (emailExists) {
        return badRequestResponse('A contact with this email already exists')
      }
    }

    // Track changes for activity logging
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (email !== undefined && email !== existingContact.email) {
      changes.email = { old: existingContact.email, new: email }
    }
    if (firstName !== undefined && firstName !== existingContact.firstName) {
      changes.firstName = { old: existingContact.firstName, new: firstName }
    }
    if (lastName !== undefined && lastName !== existingContact.lastName) {
      changes.lastName = { old: existingContact.lastName, new: lastName }
    }
    if (phone !== undefined && phone !== existingContact.phone) {
      changes.phone = { old: existingContact.phone, new: phone }
    }
    if (notes !== undefined && notes !== existingContact.notes) {
      changes.notes = { old: existingContact.notes, new: notes }
    }

    // Log status change separately
    if (status !== undefined && status !== existingContact.status) {
      await logStatusChanged(id, existingContact.status, status, token?.sub)
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        phone,
        source,
        sourceDetails,
        status,
        notes,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Log field changes
    if (Object.keys(changes).length > 0) {
      await logContactUpdated(id, changes, token?.sub)
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      const existingTagIds = existingContact.tags.map((t) => t.tagId)
      const existingTagNames = existingContact.tags.map((t) => t.tag.name)

      // Find added and removed tags
      const addedTagIds = tagIds.filter((tid: string) => !existingTagIds.includes(tid))
      const removedTagIds = existingTagIds.filter((tid) => !tagIds.includes(tid))
      const removedTagNames = existingContact.tags
        .filter((t) => removedTagIds.includes(t.tagId))
        .map((t) => t.tag.name)

      // Remove all existing tags
      await prisma.contactTag.deleteMany({
        where: { contactId: id },
      })

      // Add new tags
      if (tagIds.length > 0) {
        await prisma.contactTag.createMany({
          data: tagIds.map((tagId: string) => ({
            contactId: id,
            tagId,
          })),
        })
      }

      // Fetch updated contact with tags
      const updatedContact = await prisma.contact.findUnique({
        where: { id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })

      // Log tag changes
      if (addedTagIds.length > 0 && updatedContact) {
        const addedTagNames = updatedContact.tags
          .filter((t) => addedTagIds.includes(t.tagId))
          .map((t) => t.tag.name)
        await logTagsAdded(id, addedTagNames, token?.sub)
      }
      if (removedTagNames.length > 0) {
        await logTagsRemoved(id, removedTagNames, token?.sub)
      }

      return NextResponse.json({
        ...updatedContact,
        tags: updatedContact?.tags.map((ct) => ct.tag) || [],
      })
    }

    return NextResponse.json({
      ...contact,
      tags: contact.tags.map((ct) => ct.tag),
    })
  } catch (error) {
    logger.error('Failed to update contact:', error)
    return errorResponse('Failed to update contact')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!contact) {
      return notFoundResponse('Contact not found')
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete contact:', error)
    return errorResponse('Failed to delete contact')
  }
}
