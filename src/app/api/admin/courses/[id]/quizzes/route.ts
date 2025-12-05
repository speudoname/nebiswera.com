import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/quizzes - List all quizzes for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const quizzes = await prisma.lmsQuiz.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            question: true,
            points: true,
            order: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return successResponse(quizzes)
  } catch (error) {
    logger.error('Failed to fetch quizzes:', error)
    return errorResponse('Failed to fetch quizzes')
  }
}

// POST /api/admin/courses/[id]/quizzes - Create new quiz
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const {
      title,
      description,
      passingScore,
      maxAttempts,
      cooldownMinutes,
      shuffleQuestions,
      shuffleOptions,
      showCorrectAnswers,
    } = body

    if (!title) {
      return badRequestResponse('Title is required')
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    })

    if (!course) {
      return badRequestResponse('Course not found')
    }

    const quiz = await prisma.lmsQuiz.create({
      data: {
        courseId,
        title,
        description: description || null,
        passingScore: passingScore ?? 70,
        maxAttempts: maxAttempts ?? null,
        cooldownMinutes: cooldownMinutes ?? null,
        shuffleQuestions: shuffleQuestions ?? false,
        shuffleOptions: shuffleOptions ?? false,
        showCorrectAnswers: showCorrectAnswers ?? true,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse(quiz, 201)
  } catch (error) {
    logger.error('Failed to create quiz:', error)
    return errorResponse('Failed to create quiz')
  }
}
