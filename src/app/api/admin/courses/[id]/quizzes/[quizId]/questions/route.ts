import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { LmsQuestionType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; quizId: string }>
}

// POST /api/admin/courses/[id]/quizzes/[quizId]/questions - Create question
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { quizId } = await params

  try {
    const body = await request.json()
    const { type, question, explanation, points, options, correctAnswer } = body

    if (!type || !question) {
      return badRequestResponse('Type and question are required')
    }

    // Validate question type
    const validTypes: LmsQuestionType[] = [
      'MULTIPLE_CHOICE_SINGLE',
      'MULTIPLE_CHOICE_MULTIPLE',
      'TRUE_FALSE',
      'SHORT_ANSWER',
      'ESSAY',
    ]
    if (!validTypes.includes(type)) {
      return badRequestResponse('Invalid question type')
    }

    // Verify quiz exists
    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    })

    if (!quiz) {
      return notFoundResponse('Quiz not found')
    }

    // Get the next order number
    const lastQuestion = await prisma.lmsQuizQuestion.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    // Validate options for multiple choice
    if (['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'TRUE_FALSE'].includes(type)) {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return badRequestResponse('At least 2 options required for this question type')
      }
      // Validate option structure
      for (const opt of options) {
        if (!opt.id || !opt.text || typeof opt.isCorrect !== 'boolean') {
          return badRequestResponse('Each option must have id, text, and isCorrect')
        }
      }
      // Ensure at least one correct answer
      const hasCorrect = options.some((opt: { isCorrect: boolean }) => opt.isCorrect)
      if (!hasCorrect) {
        return badRequestResponse('At least one option must be marked as correct')
      }
    }

    const questionRecord = await prisma.lmsQuizQuestion.create({
      data: {
        quizId,
        type: type as LmsQuestionType,
        question,
        explanation: explanation || null,
        points: points ?? 1,
        order: (lastQuestion?.order ?? -1) + 1,
        options: options || [],
        correctAnswer: correctAnswer || null,
      },
    })

    return successResponse(questionRecord, 201)
  } catch (error) {
    logger.error('Failed to create question:', error)
    return errorResponse('Failed to create question')
  }
}

// POST /api/admin/courses/[id]/quizzes/[quizId]/questions/reorder - Reorder questions
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { quizId } = await params

  try {
    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return badRequestResponse('Items array required')
    }

    // Update all question orders
    await Promise.all(
      items.map((item: { id: string; order: number }) =>
        prisma.lmsQuizQuestion.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    // Fetch updated questions
    const questions = await prisma.lmsQuizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    })

    return successResponse(questions)
  } catch (error) {
    logger.error('Failed to reorder questions:', error)
    return errorResponse('Failed to reorder questions')
  }
}
