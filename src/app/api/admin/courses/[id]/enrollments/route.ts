import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import { queueEnrollmentNotifications } from '@/app/api/courses/lib/notifications'
import { trackEnrollment } from '@/app/api/courses/lib/analytics'
import type { NextRequest } from 'next/server'
import type { EnrollmentStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/enrollments - List all enrollments for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status') as EnrollmentStatus | null
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  try {
    const where: Record<string, unknown> = { courseId }

    if (status) {
      where.status = status
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ])

    // Get stats
    const stats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { courseId },
      _count: true,
    })

    const statusCounts = stats.reduce((acc, s) => {
      acc[s.status] = s._count
      return acc
    }, {} as Record<string, number>)

    return successResponse({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        active: statusCounts.ACTIVE || 0,
        completed: statusCounts.COMPLETED || 0,
        expired: statusCounts.EXPIRED || 0,
        suspended: statusCounts.SUSPENDED || 0,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch enrollments:', error)
    return errorResponse('Failed to fetch enrollments')
  }
}

// POST /api/admin/courses/[id]/enrollments - Manually enroll a user
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { userId, email, expiresAt } = body

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, settings: true },
    })

    if (!course) {
      return badRequestResponse('Course not found')
    }

    // Find user by ID or email
    let user
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      })
    }

    if (!user) {
      return badRequestResponse('User not found')
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: user.id,
        },
      },
    })

    if (existing) {
      return badRequestResponse('User is already enrolled in this course')
    }

    // Calculate expiration if course has expiration setting
    let calculatedExpiresAt = expiresAt ? new Date(expiresAt) : null
    if (!calculatedExpiresAt) {
      const settings = course.settings as { expirationDays?: number | null } | null
      if (settings?.expirationDays) {
        calculatedExpiresAt = new Date()
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + settings.expirationDays)
      }
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId: user.id,
        expiresAt: calculatedExpiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Queue enrollment notifications (welcome emails, etc.)
    try {
      await queueEnrollmentNotifications(enrollment.id)
      logger.log(`Queued enrollment notifications for ${enrollment.id}`)
    } catch (notificationError) {
      logger.error('Failed to queue enrollment notifications:', notificationError)
      // Don't fail the enrollment creation if notifications fail
    }

    // Track analytics event
    try {
      await trackEnrollment(courseId, user.id, enrollment.id)
    } catch (analyticsError) {
      logger.error('Failed to track enrollment analytics:', analyticsError)
      // Don't fail the enrollment creation if analytics tracking fails
    }

    return successResponse(enrollment, 201)
  } catch (error) {
    logger.error('Failed to create enrollment:', error)
    return errorResponse('Failed to create enrollment')
  }
}
