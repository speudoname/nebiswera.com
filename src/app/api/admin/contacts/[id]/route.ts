import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, source, sourceDetails, status, notes, tagIds } = body

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check if email is being changed and already exists
    if (email && email !== existingContact.email) {
      const emailExists = await prisma.contact.findUnique({
        where: { email },
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 400 }
        )
      }
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

    // Update tags if provided
    if (tagIds !== undefined) {
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
    console.error('Failed to update contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
