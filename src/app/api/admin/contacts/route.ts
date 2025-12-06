import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { logContactCreated } from '@/app/api/admin/contacts/lib/contact-activity'
import { parsePaginationParams, createPaginationResult, unauthorizedResponse, badRequestResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(request, { defaultLimit: 10 })
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'
  const source = searchParams.get('source') || 'all'
  const tagId = searchParams.get('tagId') || ''

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

  const result = createPaginationResult(
    contacts.map((contact) => ({
      ...contact,
      tags: contact.tags.map((ct) => ct.tag),
    })),
    total,
    { page, limit, skip }
  )

  return NextResponse.json({
    contacts: result.data,
    sources: sources.map((s) => s.source),
    pagination: result.pagination,
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { email, firstName, lastName, phone, source, sourceDetails, status, notes, tagIds } = body

    if (!email) {
      return badRequestResponse('Email is required')
    }

    if (!source) {
      return badRequestResponse('Source is required')
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: { email },
    })

    if (existingContact) {
      return badRequestResponse('A contact with this email already exists')
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
    logger.error('Failed to create contact:', error)
    return errorResponse('Failed to create contact')
  }
}
