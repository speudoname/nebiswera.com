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
import { trackQuizEvent } from '@/app/api/courses/lib/analytics'

interface RouteParams {
  params: Promise<{ slug: string; quizId: string }>
}

// POST /api/courses/[slug]/quiz/[quizId]/start - Start a new quiz attempt
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { slug, quizId } = await params

  try {
    const body = await request.json().catch(() => ({}))
    const { anonymousId } = body

    // Find the course
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, accessType: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Check enrollment for non-open courses
    let enrollment = null
    if (course.accessType !== 'OPEN') {
      if (!session?.user?.id) {
        return unauthorizedResponse('You must be logged in')
      }

      enrollment = await prisma.enrollment.findUnique({
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
    }

    // Get quiz
    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId, courseId: course.id },
    })

    if (!quiz) {
      return notFoundResponse('Quiz not found')
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.lmsQuizAttempt.findFirst({
      where: {
        quizId,
        completedAt: null,
        ...(session?.user?.id
          ? { userId: session.user.id }
          : anonymousId
            ? { anonymousId }
            : {}),
      },
    })

    if (existingAttempt) {
      return successResponse({
        attemptId: existingAttempt.id,
        message: 'Resuming existing attempt',
        isResume: true,
      })
    }

    // Check max attempts
    if (quiz.maxAttempts) {
      const completedAttempts = await prisma.lmsQuizAttempt.count({
        where: {
          quizId,
          completedAt: { not: null },
          ...(session?.user?.id
            ? { userId: session.user.id }
            : anonymousId
              ? { anonymousId }
              : {}),
        },
      })

      if (completedAttempts >= quiz.maxAttempts) {
        return badRequestResponse('Maximum attempts reached')
      }
    }

    // Check cooldown
    if (quiz.cooldownMinutes) {
      const lastAttempt = await prisma.lmsQuizAttempt.findFirst({
        where: {
          quizId,
          completedAt: { not: null },
          ...(session?.user?.id
            ? { userId: session.user.id }
            : anonymousId
              ? { anonymousId }
              : {}),
        },
        orderBy: { completedAt: 'desc' },
      })

      if (lastAttempt?.completedAt) {
        const cooldownEnd = new Date(lastAttempt.completedAt)
        cooldownEnd.setMinutes(cooldownEnd.getMinutes() + quiz.cooldownMinutes)

        if (cooldownEnd > new Date()) {
          return badRequestResponse(
            `Please wait until ${cooldownEnd.toISOString()} before retrying`
          )
        }
      }
    }

    // Create new attempt
    const attempt = await prisma.lmsQuizAttempt.create({
      data: {
        quizId,
        userId: session?.user?.id || null,
        anonymousId: session?.user?.id ? null : anonymousId || null,
      },
    })

    // Track analytics
    try {
      await trackQuizEvent(
        course.id,
        quizId,
        'QUIZ_STARTED',
        session?.user?.id || null,
        enrollment?.id || null
      )
    } catch (e) {
      console.error('Failed to track quiz start:', e)
    }

    return successResponse({
      attemptId: attempt.id,
      message: 'Quiz attempt started',
      isResume: false,
    }, 201)
  } catch (error) {
    console.error('Failed to start quiz:', error)
    return errorResponse('Failed to start quiz')
  }
}
