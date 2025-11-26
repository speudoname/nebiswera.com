import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { WebinarStatus, Prisma } from '@prisma/client'

// GET /api/admin/webinars - List webinars with filters
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where: Prisma.WebinarWhereInput = {}

  if (status !== 'all') {
    where.status = status as WebinarStatus
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { presenterName: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [webinars, total] = await Promise.all([
      prisma.webinar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          presenterName: true,
          videoDuration: true,
          timezone: true,
          createdAt: true,
          publishedAt: true,
          scheduleConfig: {
            select: {
              eventType: true,
              onDemandEnabled: true,
              justInTimeEnabled: true,
              replayEnabled: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              sessions: true,
            },
          },
        },
      }),
      prisma.webinar.count({ where }),
    ])

    return NextResponse.json({
      webinars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch webinars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webinars' },
      { status: 500 }
    )
  }
}

// Helper to generate unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// POST /api/admin/webinars - Create new webinar
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      slug: providedSlug,
      description,
      presenterName,
      presenterTitle,
      presenterAvatar,
      presenterBio,
      timezone,
      completionPercent,
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Generate slug from title if not provided
    const baseSlug = providedSlug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const slug = await generateUniqueSlug(baseSlug)

    const webinar = await prisma.webinar.create({
      data: {
        title,
        slug,
        description: description || null,
        presenterName: presenterName || null,
        presenterTitle: presenterTitle || null,
        presenterAvatar: presenterAvatar || null,
        presenterBio: presenterBio || null,
        timezone: timezone || 'Asia/Tbilisi',
        completionPercent: completionPercent || 80,
      },
      include: {
        scheduleConfig: true,
        _count: {
          select: {
            registrations: true,
            sessions: true,
          },
        },
      },
    })

    return NextResponse.json(webinar, { status: 201 })
  } catch (error) {
    console.error('Failed to create webinar:', error)
    return NextResponse.json(
      { error: 'Failed to create webinar' },
      { status: 500 }
    )
  }
}
