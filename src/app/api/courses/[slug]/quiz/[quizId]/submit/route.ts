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
import { parseQuizOptions } from '@/lib/lms/types'
import { markPartCompleteByQuiz, recordQuizResultWithNotifications } from '@/lib/lms/progress'
import { trackQuizEvent } from '@/app/api/courses/lib/analytics'

interface RouteParams {
  params: Promise<{ slug: string; quizId: string }>
}

interface SubmittedAnswer {
  questionId: string
  selectedOptions?: string[]
  textAnswer?: string
}

// POST /api/courses/[slug]/quiz/[quizId]/submit - Submit quiz answers
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { slug, quizId } = await params

  try {
    const body = await request.json()
    const { attemptId, answers, partId } = body as {
      attemptId: string
      answers: SubmittedAnswer[]
      partId?: string
    }

    if (!attemptId || !answers) {
      return badRequestResponse('Attempt ID and answers are required')
    }

    // Find the course
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, accessType: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Get enrollment if exists
    let enrollment = null
    if (session?.user?.id) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: course.id,
            userId: session.user.id,
          },
        },
      })
    }

    // Get quiz with questions
    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId, courseId: course.id },
      include: {
        questions: true,
      },
    })

    if (!quiz) {
      return notFoundResponse('Quiz not found')
    }

    // Verify attempt exists and belongs to user
    const attempt = await prisma.lmsQuizAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return notFoundResponse('Attempt not found')
    }

    if (attempt.quizId !== quizId) {
      return badRequestResponse('Attempt does not belong to this quiz')
    }

    if (session?.user?.id && attempt.userId !== session.user.id) {
      return badRequestResponse('Attempt does not belong to you')
    }

    if (attempt.completedAt) {
      return badRequestResponse('This attempt has already been submitted')
    }

    // Grade the quiz
    let totalPoints = 0
    let earnedPoints = 0
    const gradedAnswers: {
      questionId: string
      isCorrect: boolean
      pointsAwarded: number
      correctAnswer?: string[]
      explanation?: string
    }[] = []

    for (const question of quiz.questions) {
      const submittedAnswer = answers.find((a) => a.questionId === question.id)
      const options = parseQuizOptions(question.options)

      let isCorrect = false
      let pointsAwarded = 0

      if (question.type === 'MULTIPLE_CHOICE_SINGLE' || question.type === 'TRUE_FALSE') {
        // Single selection - check if selected option is correct
        const selectedId = submittedAnswer?.selectedOptions?.[0]
        const correctOption = options.find((o) => o.isCorrect)
        isCorrect = selectedId === correctOption?.id
        pointsAwarded = isCorrect ? question.points : 0
      } else if (question.type === 'MULTIPLE_CHOICE_MULTIPLE') {
        // Multiple selection - all correct options must be selected, no incorrect ones
        const selectedIds = new Set(submittedAnswer?.selectedOptions || [])
        const correctIds = new Set(options.filter((o) => o.isCorrect).map((o) => o.id))

        const allCorrectSelected = Array.from(correctIds).every((id) => selectedIds.has(id))
        const noIncorrectSelected = Array.from(selectedIds).every((id) => correctIds.has(id))

        isCorrect = allCorrectSelected && noIncorrectSelected
        pointsAwarded = isCorrect ? question.points : 0
      } else if (question.type === 'SHORT_ANSWER') {
        // Short answer - case-insensitive match
        const userAnswer = (submittedAnswer?.textAnswer || '').trim().toLowerCase()
        const correctAnswer = (question.correctAnswer || '').trim().toLowerCase()
        isCorrect = userAnswer === correctAnswer
        pointsAwarded = isCorrect ? question.points : 0
      } else if (question.type === 'ESSAY') {
        // Essay - cannot be auto-graded, mark as pending
        isCorrect = false // Will be graded manually
        pointsAwarded = 0 // Will be updated manually
      }

      totalPoints += question.points
      earnedPoints += pointsAwarded

      // Save answer
      await prisma.lmsQuizAnswer.create({
        data: {
          attemptId,
          questionId: question.id,
          selectedOptions: submittedAnswer?.selectedOptions || [],
          textAnswer: submittedAnswer?.textAnswer || null,
          isCorrect,
          pointsAwarded,
        },
      })

      // Build graded answer for response
      const correctOptionIds = options.filter((o) => o.isCorrect).map((o) => o.id)
      gradedAnswers.push({
        questionId: question.id,
        isCorrect,
        pointsAwarded,
        ...(quiz.showCorrectAnswers && {
          correctAnswer: question.type === 'SHORT_ANSWER'
            ? [question.correctAnswer || '']
            : correctOptionIds,
          explanation: question.explanation || undefined,
        }),
      })
    }

    // Calculate score
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= quiz.passingScore

    // Update attempt
    await prisma.lmsQuizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        passed,
        completedAt: new Date(),
      },
    })

    // Calculate remaining attempts
    let attemptsRemaining: number | undefined
    if (quiz.maxAttempts) {
      const completedAttempts = await prisma.lmsQuizAttempt.count({
        where: {
          quizId,
          completedAt: { not: null },
          ...(session?.user?.id
            ? { userId: session.user.id }
            : attempt.anonymousId
              ? { anonymousId: attempt.anonymousId }
              : {}),
        },
      })
      attemptsRemaining = quiz.maxAttempts - completedAttempts
    }

    // If passed and this quiz is attached to a part, mark part as complete
    if (passed && partId && enrollment) {
      try {
        await markPartCompleteByQuiz(enrollment.id, partId)
      } catch (e) {
        logger.error('Failed to mark part complete:', e)
      }
    }

    // Queue notifications
    if (enrollment) {
      try {
        await recordQuizResultWithNotifications(
          enrollment.id,
          quizId,
          quiz.title,
          score,
          quiz.passingScore,
          passed,
          attemptsRemaining
        )
      } catch (e) {
        logger.error('Failed to queue quiz notifications:', e)
      }
    }

    // Track analytics
    try {
      await trackQuizEvent(
        course.id,
        quizId,
        passed ? 'QUIZ_PASSED' : 'QUIZ_FAILED',
        session?.user?.id || null,
        enrollment?.id || null,
        { score, passingScore: quiz.passingScore }
      )
    } catch (e) {
      logger.error('Failed to track quiz submit:', e)
    }

    return successResponse({
      score,
      passed,
      passingScore: quiz.passingScore,
      earnedPoints,
      totalPoints,
      answers: gradedAnswers,
      attemptsRemaining,
      canRetry: attemptsRemaining === undefined || attemptsRemaining > 0,
      cooldownMinutes: quiz.cooldownMinutes,
    })
  } catch (error) {
    logger.error('Failed to submit quiz:', error)
    return errorResponse('Failed to submit quiz')
  }
}
