import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib'
import {
  updatePartVideoProgress,
  completePartWithNotifications,
} from '@/lib/lms/progress'
import { trackPartView, trackVideoProgress } from '@/app/api/courses/lib/analytics'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/courses/[slug]/progress - Update progress for a part
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorizedResponse('You must be logged in to track progress')
  }

  const { slug } = await params

  try {
    const body = await request.json()
    const { partId, lessonId, lessonTitle, watchTime, duration, watchPercent, action } = body

    if (!partId) {
      return badRequestResponse('Part ID is required')
    }

    // Find the course and enrollment
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
    })

    if (!enrollment) {
      return badRequestResponse('You are not enrolled in this course')
    }

    // Check if enrollment has expired or is suspended
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
      return badRequestResponse('Your enrollment has expired')
    }

    if (enrollment.status === 'SUSPENDED') {
      return badRequestResponse('Your enrollment has been suspended')
    }

    // Handle different progress update types
    if (action === 'complete') {
      // Manual completion
      const result = await completePartWithNotifications(enrollment.id, partId, {
        lessonId,
        lessonTitle,
        completedBy: 'MANUAL',
      })

      return successResponse({
        message: 'Part marked as complete',
        progressPercent: result.progressPercent,
        isCompleted: result.isCompleted,
        wasJustCompleted: result.wasJustCompleted,
      })
    }

    if (typeof watchTime === 'number' && typeof duration === 'number') {
      // Video/audio progress update
      const result = await updatePartVideoProgress(
        enrollment.id,
        partId,
        watchTime,
        duration
      )

      // Track video progress milestone (every 10%)
      const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const currentMilestone = milestones.find((m) => watchPercent >= m && watchPercent < m + 10)
      if (currentMilestone) {
        try {
          await trackVideoProgress(
            course.id,
            partId,
            currentMilestone,
            session.user.id,
            undefined,
            enrollment.id
          )
        } catch (e) {
          console.error('Failed to track video progress:', e)
        }
      }

      return successResponse({
        message: 'Progress updated',
        watchPercent: result.watchPercent,
        isCompleted: result.isCompleted,
        progressPercent: result.progressPercent,
      })
    }

    // Just view tracking
    try {
      await trackPartView(
        course.id,
        partId,
        lessonId || '',
        undefined,
        session.user.id,
        undefined,
        enrollment.id
      )
    } catch (e) {
      console.error('Failed to track part view:', e)
    }

    return successResponse({ message: 'Progress tracked' })
  } catch (error) {
    console.error('Failed to update progress:', error)
    return errorResponse('Failed to update progress')
  }
}

// GET /api/courses/[slug]/progress - Get current progress
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.id) {
    return successResponse({ enrolled: false, progress: null })
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
      include: {
        partProgress: {
          select: {
            partId: true,
            status: true,
            watchTime: true,
            watchPercent: true,
            completedAt: true,
          },
        },
      },
    })

    if (!enrollment) {
      return successResponse({ enrolled: false, progress: null })
    }

    return successResponse({
      enrolled: true,
      progress: {
        enrollmentId: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        enrolledAt: enrollment.enrolledAt,
        expiresAt: enrollment.expiresAt,
        completedAt: enrollment.completedAt,
        parts: enrollment.partProgress.reduce(
          (acc, p) => {
            acc[p.partId] = {
              status: p.status,
              watchTime: p.watchTime,
              watchPercent: p.watchPercent,
              completedAt: p.completedAt,
            }
            return acc
          },
          {} as Record<string, unknown>
        ),
      },
    })
  } catch (error) {
    console.error('Failed to get progress:', error)
    return errorResponse('Failed to get progress')
  }
}
