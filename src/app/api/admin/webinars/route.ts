import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger, parsePaginationParams, createPaginationResult } from '@/lib'
import { createDefaultNotifications } from '@/app/api/webinars/lib/notifications'
import type { NextRequest } from 'next/server'
import type { WebinarStatus, Prisma } from '@prisma/client'

// GET /api/admin/webinars - List webinars with filters
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(request)
  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''

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

    const result = createPaginationResult(webinars, total, { page, limit, skip })
    return successResponse({
      webinars: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('Failed to fetch webinars:', error)
    return errorResponse('Failed to fetch webinars')
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
    return unauthorizedResponse()
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
      return badRequestResponse('Title is required')
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

    // Create default notification templates for the new webinar
    try {
      await createDefaultNotifications(webinar.id)
    } catch (error) {
      // Don't fail the webinar creation if notifications fail
      logger.error('Failed to create default notifications:', error)
    }

    return successResponse(webinar, 201)
  } catch (error) {
    logger.error('Failed to create webinar:', error)
    return errorResponse('Failed to create webinar')
  }
}
