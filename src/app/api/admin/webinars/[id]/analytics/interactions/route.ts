import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/admin/webinars/[id]/analytics/interactions
 * Get comprehensive analytics for webinar interactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const webinarId = params.id

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      select: { id: true, title: true, videoDuration: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Get all interactions for this webinar
    const interactions = await prisma.webinarInteraction.findMany({
      where: { webinarId },
      include: {
        events: {
          include: {
            registration: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { triggersAt: 'asc' },
    })

    // Get total registrations (viewers)
    const totalRegistrations = await prisma.webinarRegistration.count({
      where: { webinarId },
    })

    // Get registrations that actually watched (joinedAt is not null)
    const totalViewers = await prisma.webinarRegistration.count({
      where: {
        webinarId,
        joinedAt: { not: null },
      },
    })

    // Calculate analytics per interaction
    const interactionAnalytics = interactions.map((interaction) => {
      const events = interaction.events
      const responseCount = events.length
      const responseRate =
        totalViewers > 0 ? (responseCount / totalViewers) * 100 : 0

      // Aggregate poll/quiz results
      let aggregatedResults: any = null

      if (interaction.type === 'POLL' || interaction.type === 'QUIZ') {
        const config = interaction.content as {
          options?: string[]
          correctAnswers?: number[]
        }
        const options = config.options || []

        const optionCounts = options.map((option, index) => {
          const count = events.filter((e) => {
            const metadata = e.metadata as { selectedOptions?: number[] }
            return metadata.selectedOptions?.includes(index)
          }).length

          const percentage = responseCount > 0 ? (count / responseCount) * 100 : 0

          return {
            option,
            count,
            percentage,
            isCorrect: config.correctAnswers?.includes(index) || false,
          }
        })

        aggregatedResults = {
          options: optionCounts,
          totalResponses: responseCount,
        }

        // For quiz, add accuracy metrics
        if (interaction.type === 'QUIZ') {
          const correctResponses = events.filter((e) => {
            const metadata = e.metadata as { isCorrect?: boolean }
            return metadata.isCorrect === true
          }).length

          aggregatedResults.correctResponses = correctResponses
          aggregatedResults.accuracy =
            responseCount > 0 ? (correctResponses / responseCount) * 100 : 0
        }
      }

      // For feedback, aggregate ratings
      if (interaction.type === 'FEEDBACK') {
        const ratings = events.map((e) => {
          const metadata = e.metadata as { rating?: number }
          return metadata.rating || 0
        })

        const ratingCounts = {
          1: ratings.filter((r) => r === 1).length, // Great
          2: ratings.filter((r) => r === 2).length, // Okay
          3: ratings.filter((r) => r === 3).length, // Poor
        }

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0

        aggregatedResults = {
          ratings: ratingCounts,
          averageRating: avgRating,
          totalResponses: responseCount,
        }
      }

      // For contact forms, count submissions
      if (interaction.type === 'CONTACT_FORM') {
        aggregatedResults = {
          totalSubmissions: responseCount,
          completionRate: responseRate,
        }
      }

      // For questions, count responses
      if (interaction.type === 'QUESTION') {
        aggregatedResults = {
          totalResponses: responseCount,
          responses: events.map((e) => {
            const metadata = e.metadata as { textResponse?: string }
            const reg = e.registration
            const userName = reg.firstName
              ? `${reg.firstName} ${reg.lastName || ''}`.trim()
              : reg.email
            return {
              text: metadata.textResponse,
              respondedAt: e.createdAt,
              user: userName,
            }
          }),
        }
      }

      return {
        id: interaction.id,
        type: interaction.type,
        title: interaction.title,
        triggerTime: interaction.triggersAt,
        responseCount,
        responseRate,
        aggregatedResults,
      }
    })

    // Calculate engagement score (% of interactions responded to)
    const totalInteractions = interactions.length
    const totalPossibleResponses = totalInteractions * totalViewers
    const totalActualResponses = interactions.reduce(
      (sum, i) => sum + i.events.length,
      0
    )
    const engagementScore =
      totalPossibleResponses > 0
        ? (totalActualResponses / totalPossibleResponses) * 100
        : 0

    // Calculate drop-off points (analyze watch progress)
    const registrations = await prisma.webinarRegistration.findMany({
      where: {
        webinarId,
        joinedAt: { not: null },
      },
      select: {
        maxVideoPosition: true,
        completedAt: true,
      },
    })

    // Calculate percentage watched for each registration
    const videoDuration = webinar.videoDuration || 1 // Avoid division by zero
    const watchPercentages = registrations.map((r) => ({
      percentage: (r.maxVideoPosition / videoDuration) * 100,
      completed: r.completedAt !== null,
    }))

    // Group by 10% intervals
    const dropOffPoints = Array.from({ length: 10 }, (_, i) => {
      const rangeStart = i * 10
      const rangeEnd = (i + 1) * 10
      const count = watchPercentages.filter(
        (p) => p.percentage >= rangeStart && p.percentage < rangeEnd
      ).length

      return {
        range: `${rangeStart}-${rangeEnd}%`,
        count,
        percentage: totalViewers > 0 ? (count / totalViewers) * 100 : 0,
      }
    })

    // Calculate completion rate (watched >= 90% or completed)
    const completedViews = watchPercentages.filter((p) => p.completed || p.percentage >= 90).length
    const completionRate = totalViewers > 0 ? (completedViews / totalViewers) * 100 : 0

    return NextResponse.json({
      webinar: {
        id: webinar.id,
        title: webinar.title,
        duration: webinar.videoDuration,
      },
      overview: {
        totalRegistrations,
        totalViewers,
        totalInteractions,
        totalResponses: totalActualResponses,
        engagementScore,
        completionRate,
      },
      interactions: interactionAnalytics,
      dropOffAnalysis: dropOffPoints,
    })
  } catch (error) {
    logger.error('Failed to fetch interaction analytics:', error)
    return errorResponse('Failed to fetch analytics')
  }
}
