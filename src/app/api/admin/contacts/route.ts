import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { logContactCreated } from '@/app/api/admin/contacts/lib/contact-activity'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'
  const source = searchParams.get('source') || 'all'
  const tagId = searchParams.get('tagId') || ''

  const skip = (page - 1) * limit

  const where: Prisma.ContactWhereInput = {}

  // Search by email, firstName, lastName, or phone
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Filter by status
  if (status !== 'all') {
    where.status = status as 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'
  }

  // Filter by source
  if (source !== 'all') {
    where.source = source
  }

  // Filter by tag
  if (tagId) {
    where.tags = {
      some: {
        tagId: tagId,
      },
    }
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    }),
    prisma.contact.count({ where }),
  ])

  // Get unique sources for filter dropdown
  const sources = await prisma.contact.findMany({
    select: { source: true },
    distinct: ['source'],
  })

  return NextResponse.json({
    contacts: contacts.map((contact) => ({
      ...contact,
      tags: contact.tags.map((ct) => ct.tag),
    })),
    sources: sources.map((s) => s.source),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { email, firstName, lastName, phone, source, sourceDetails, status, notes, tagIds } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!source) {
      return NextResponse.json({ error: 'Source is required' }, { status: 400 })
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: { email },
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 400 }
      )
    }

    // Create contact with tags
    const contact = await prisma.contact.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        source,
        sourceDetails,
        status: status || 'ACTIVE',
        notes,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    await logContactCreated(contact, token?.sub, source)

    return NextResponse.json({
      ...contact,
      tags: contact.tags.map((ct) => ct.tag),
    })
  } catch (error) {
    console.error('Failed to create contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
