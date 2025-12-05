import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import { DEFAULT_COURSE_SETTINGS } from '@/lib/lms/types'
import type { NextRequest } from 'next/server'
import type { CourseStatus, Prisma } from '@prisma/client'

// GET /api/admin/courses - List courses with filters
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all'
  const accessType = searchParams.get('accessType') || 'all'
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where: Prisma.CourseWhereInput = {}

  if (status !== 'all') {
    where.status = status as CourseStatus
  }

  if (accessType !== 'all') {
    where.accessType = accessType as 'OPEN' | 'FREE' | 'PAID'
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail: true,
          locale: true,
          accessType: true,
          price: true,
          currency: true,
          status: true,
          version: true,
          createdAt: true,
          publishedAt: true,
          _count: {
            select: {
              modules: true,
              lessons: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ])

    return successResponse({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Failed to fetch courses:', error)
    return errorResponse('Failed to fetch courses')
  }
}

// Helper to generate unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.course.findUnique({
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

// POST /api/admin/courses - Create new course
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
      thumbnail,
      locale,
      accessType,
      price,
      currency,
      settings,
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

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        locale: locale || 'ka',
        accessType: accessType || 'FREE',
        price: price ? parseFloat(price) : null,
        currency: currency || 'GEL',
        settings: settings || DEFAULT_COURSE_SETTINGS,
      },
      include: {
        _count: {
          select: {
            modules: true,
            lessons: true,
            enrollments: true,
          },
        },
      },
    })

    return successResponse(course, 201)
  } catch (error) {
    logger.error('Failed to create course:', error)
    return errorResponse('Failed to create course')
  }
}
