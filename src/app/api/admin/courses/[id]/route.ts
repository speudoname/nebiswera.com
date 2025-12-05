import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id] - Get single course with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                parts: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        lessons: {
          where: { moduleId: null },
          orderBy: { order: 'asc' },
          include: {
            parts: {
              orderBy: { order: 'asc' },
            },
          },
        },
        quizzes: {
          orderBy: { createdAt: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
            lessons: true,
          },
        },
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    return successResponse(course)
  } catch (error) {
    logger.error('Failed to fetch course:', error)
    return errorResponse('Failed to fetch course')
  }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const {
      title,
      slug,
      description,
      thumbnail,
      locale,
      accessType,
      price,
      currency,
      settings,
      status,
    } = body

    // Check if course exists
    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true, slug: true },
    })

    if (!existing) {
      return notFoundResponse('Course not found')
    }

    // If slug is being changed, check for uniqueness
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.course.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (slugExists && slugExists.id !== id) {
        return badRequestResponse('Slug already exists')
      }
    }

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (locale !== undefined) updateData.locale = locale
    if (accessType !== undefined) updateData.accessType = accessType
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null
    if (currency !== undefined) updateData.currency = currency
    if (settings !== undefined) updateData.settings = settings
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED' && !existing) {
        updateData.publishedAt = new Date()
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
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

    return successResponse(course)
  } catch (error) {
    logger.error('Failed to update course:', error)
    return errorResponse('Failed to update course')
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Only allow deletion of DRAFT or ARCHIVED courses
    if (course.status === 'PUBLISHED') {
      return badRequestResponse('Cannot delete a published course. Archive it first.')
    }

    // Warn if there are enrollments
    if (course._count.enrollments > 0) {
      return badRequestResponse(`Cannot delete course with ${course._count.enrollments} enrollments. Remove enrollments first.`)
    }

    await prisma.course.delete({
      where: { id },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete course:', error)
    return errorResponse('Failed to delete course')
  }
}
