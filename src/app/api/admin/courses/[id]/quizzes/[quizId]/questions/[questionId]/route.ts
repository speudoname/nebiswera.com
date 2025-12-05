import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { LmsQuestionType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; quizId: string; questionId: string }>
}

// GET /api/admin/courses/[id]/quizzes/[quizId]/questions/[questionId] - Get single question
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { questionId } = await params

  try {
    const question = await prisma.lmsQuizQuestion.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      return notFoundResponse('Question not found')
    }

    return successResponse(question)
  } catch (error) {
    logger.error('Failed to fetch question:', error)
    return errorResponse('Failed to fetch question')
  }
}

// PUT /api/admin/courses/[id]/quizzes/[quizId]/questions/[questionId] - Update question
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { questionId } = await params

  try {
    const body = await request.json()
    const { type, question, explanation, points, options, correctAnswer, order } = body

    const existing = await prisma.lmsQuizQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, type: true },
    })

    if (!existing) {
      return notFoundResponse('Question not found')
    }

    // Validate options if type requires them
    const questionType = type || existing.type
    if (['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'TRUE_FALSE'].includes(questionType)) {
      if (options !== undefined) {
        if (!Array.isArray(options) || options.length < 2) {
          return badRequestResponse('At least 2 options required for this question type')
        }
        for (const opt of options) {
          if (!opt.id || !opt.text || typeof opt.isCorrect !== 'boolean') {
            return badRequestResponse('Each option must have id, text, and isCorrect')
          }
        }
        const hasCorrect = options.some((opt: { isCorrect: boolean }) => opt.isCorrect)
        if (!hasCorrect) {
          return badRequestResponse('At least one option must be marked as correct')
        }
      }
    }

    const updateData: Record<string, unknown> = {}
    if (type !== undefined) updateData.type = type as LmsQuestionType
    if (question !== undefined) updateData.question = question
    if (explanation !== undefined) updateData.explanation = explanation
    if (points !== undefined) updateData.points = points
    if (options !== undefined) updateData.options = options
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer
    if (order !== undefined) updateData.order = order

    const updatedQuestion = await prisma.lmsQuizQuestion.update({
      where: { id: questionId },
      data: updateData,
    })

    return successResponse(updatedQuestion)
  } catch (error) {
    logger.error('Failed to update question:', error)
    return errorResponse('Failed to update question')
  }
}

// DELETE /api/admin/courses/[id]/quizzes/[quizId]/questions/[questionId] - Delete question
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { questionId } = await params

  try {
    const question = await prisma.lmsQuizQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, quizId: true, order: true },
    })

    if (!question) {
      return notFoundResponse('Question not found')
    }

    // Delete the question
    await prisma.lmsQuizQuestion.delete({
      where: { id: questionId },
    })

    // Reorder remaining questions
    await prisma.lmsQuizQuestion.updateMany({
      where: {
        quizId: question.quizId,
        order: { gt: question.order },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete question:', error)
    return errorResponse('Failed to delete question')
  }
}
