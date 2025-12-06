import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  logger,
} from '@/lib'
import { queueEnrollmentNotifications } from '@/app/api/courses/lib/notifications'
import { trackEnrollment } from '@/app/api/courses/lib/analytics'
import { parseCourseSettings } from '@/lib/lms/types'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/courses/[slug]/enroll - Enroll the current user in a course
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorizedResponse('You must be logged in to enroll')
  }

  const { slug } = await params

  try {
    // Find the course
    const course = await prisma.course.findUnique({
      where: { slug, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        accessType: true,
        settings: true,
        price: true,
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
    })

    if (existingEnrollment) {
      return badRequestResponse('You are already enrolled in this course')
    }

    // PAID courses require payment integration (not yet implemented)
    // When implementing, consider:
    // 1. Payment provider integration (Stripe, BOG, etc.)
    // 2. Payment verification before enrollment
    // 3. Payment record creation linked to enrollment
    // 4. Webhook handlers for async payment confirmation
    // For now, PAID courses cannot be enrolled in directly
    if (course.accessType === 'PAID') {
      return badRequestResponse(
        'This course requires payment. Please contact support or wait for payment integration.'
      )
    }

    // Calculate expiration date based on course settings
    const settings = parseCourseSettings(course.settings)
    let expiresAt: Date | null = null
    if (settings.expirationDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + settings.expirationDays)
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: course.id,
        userId: session.user.id,
        expiresAt,
      },
    })

    // Queue enrollment notifications (welcome emails, etc.)
    try {
      await queueEnrollmentNotifications(enrollment.id)
    } catch (notificationError) {
      logger.error('Failed to queue enrollment notifications:', notificationError)
      // Don't fail the enrollment if notifications fail
    }

    // Track analytics event
    try {
      await trackEnrollment(course.id, session.user.id, enrollment.id)
    } catch (analyticsError) {
      logger.error('Failed to track enrollment analytics:', analyticsError)
    }

    return successResponse(
      {
        enrollmentId: enrollment.id,
        courseId: course.id,
        message: 'Successfully enrolled',
      },
      201
    )
  } catch (error) {
    logger.error('Failed to enroll in course:', error)
    return errorResponse('Failed to enroll in course')
  }
}

// GET /api/courses/[slug]/enroll - Check enrollment status
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.id) {
    return successResponse({ isEnrolled: false })
  }

  const { slug } = await params

  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        progressPercent: true,
        enrolledAt: true,
        expiresAt: true,
        completedAt: true,
      },
    })

    if (!enrollment) {
      return successResponse({ isEnrolled: false })
    }

    return successResponse({
      isEnrolled: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        enrolledAt: enrollment.enrolledAt,
        expiresAt: enrollment.expiresAt,
        completedAt: enrollment.completedAt,
      },
    })
  } catch (error) {
    logger.error('Failed to check enrollment status:', error)
    return errorResponse('Failed to check enrollment status')
  }
}
