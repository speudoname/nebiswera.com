import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; quizId: string }>
}

// GET /api/admin/courses/[id]/quizzes/[quizId] - Get single quiz with questions
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { quizId } = await params

  try {
    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    })

    if (!quiz) {
      return notFoundResponse('Quiz not found')
    }

    return successResponse(quiz)
  } catch (error) {
    logger.error('Failed to fetch quiz:', error)
    return errorResponse('Failed to fetch quiz')
  }
}

// PUT /api/admin/courses/[id]/quizzes/[quizId] - Update quiz
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { quizId } = await params

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

    const existing = await prisma.lmsQuiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    })

    if (!existing) {
      return notFoundResponse('Quiz not found')
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (passingScore !== undefined) updateData.passingScore = passingScore
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts
    if (cooldownMinutes !== undefined) updateData.cooldownMinutes = cooldownMinutes
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = shuffleQuestions
    if (shuffleOptions !== undefined) updateData.shuffleOptions = shuffleOptions
    if (showCorrectAnswers !== undefined) updateData.showCorrectAnswers = showCorrectAnswers

    const quiz = await prisma.lmsQuiz.update({
      where: { id: quizId },
      data: updateData,
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse(quiz)
  } catch (error) {
    logger.error('Failed to update quiz:', error)
    return errorResponse('Failed to update quiz')
  }
}

// DELETE /api/admin/courses/[id]/quizzes/[quizId] - Delete quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { quizId } = await params

  try {
    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    })

    if (!quiz) {
      return notFoundResponse('Quiz not found')
    }

    // Warn if there are attempts (but still allow deletion)
    if (quiz._count.attempts > 0) {
      logger.warn(`Deleting quiz with ${quiz._count.attempts} attempts`)
    }

    await prisma.lmsQuiz.delete({
      where: { id: quizId },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete quiz:', error)
    return errorResponse('Failed to delete quiz')
  }
}
