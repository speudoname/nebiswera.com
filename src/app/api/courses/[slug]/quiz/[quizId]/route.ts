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
import { parseQuizOptions } from '@/lib/lms/types'

interface RouteParams {
  params: Promise<{ slug: string; quizId: string }>
}

// GET /api/courses/[slug]/quiz/[quizId] - Get quiz details for taking
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { slug, quizId } = await params

  try {
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

    // Get quiz with questions
    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId, courseId: course.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!quiz) {
      return notFoundResponse('Quiz not found')
    }

    // Get user's attempt history
    const attempts = await prisma.lmsQuizAttempt.findMany({
      where: {
        quizId,
        ...(session?.user?.id
          ? { userId: session.user.id }
          : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    })

    // Check if user can start a new attempt
    const completedAttempts = attempts.filter((a) => a.completedAt !== null)
    const canRetry = !quiz.maxAttempts || completedAttempts.length < quiz.maxAttempts

    // Check cooldown
    let cooldownEndsAt: Date | null = null
    if (quiz.cooldownMinutes && completedAttempts.length > 0) {
      const lastAttempt = completedAttempts[0]
      if (lastAttempt.completedAt) {
        const cooldownEnd = new Date(lastAttempt.completedAt)
        cooldownEnd.setMinutes(cooldownEnd.getMinutes() + quiz.cooldownMinutes)
        if (cooldownEnd > new Date()) {
          cooldownEndsAt = cooldownEnd
        }
      }
    }

    // Check for in-progress attempt
    const inProgressAttempt = attempts.find((a) => a.completedAt === null)

    // Prepare questions (shuffle if needed, remove correct answers)
    let questions = quiz.questions.map((q) => {
      const options = parseQuizOptions(q.options)

      // Shuffle options if enabled
      let processedOptions = options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        // Don't include isCorrect - that's server-side only
      }))

      if (quiz.shuffleOptions) {
        processedOptions = shuffleArray(processedOptions)
      }

      return {
        id: q.id,
        type: q.type,
        question: q.question,
        points: q.points,
        options: processedOptions,
        // Don't include correctAnswer or explanation until after submission
      }
    })

    // Shuffle questions if enabled
    if (quiz.shuffleQuestions) {
      questions = shuffleArray(questions)
    }

    return successResponse({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        cooldownMinutes: quiz.cooldownMinutes,
        showCorrectAnswers: quiz.showCorrectAnswers,
      },
      questions,
      attempts: completedAttempts.map((a) => ({
        id: a.id,
        score: a.score,
        passed: a.passed,
        completedAt: a.completedAt,
      })),
      canRetry,
      cooldownEndsAt,
      inProgressAttemptId: inProgressAttempt?.id || null,
      attemptsUsed: completedAttempts.length,
      attemptsRemaining: quiz.maxAttempts
        ? quiz.maxAttempts - completedAttempts.length
        : null,
    })
  } catch (error) {
    console.error('Failed to get quiz:', error)
    return errorResponse('Failed to get quiz')
  }
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
