import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { unauthorizedResponse, notFoundResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string; interactionId: string }>
}

// GET /api/webinars/[slug]/interactions/[interactionId]/results
// Get poll/quiz results with statistics
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug, interactionId } = await params
  const token = request.nextUrl.searchParams.get('token')

  try {
    if (!token) {
      return unauthorizedResponse('Access token required')
    }

    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Validate access token
    const validation = await validateAccessToken(webinar.id, token)

    if (!validation.valid || !validation.registration) {
      return unauthorizedResponse('Invalid access token')
    }

    const registrationId = validation.registration.id

    // Get interaction with options
    const interaction = await prisma.webinarInteraction.findFirst({
      where: {
        id: interactionId,
        webinarId: webinar.id,
      },
      select: {
        id: true,
        type: true,
        content: true,
      },
    })

    if (!interaction) {
      return notFoundResponse('Interaction not found')
    }

    // Only polls and quizzes have results
    if (!['POLL', 'QUIZ'].includes(interaction.type)) {
      return successResponse({ results: null })
    }

    const config = interaction.content as { options?: string[] }
    const options = config.options || []

    // Get all responses for THIS webinar session
    const sessionResponses = await prisma.webinarPollResponse.findMany({
      where: {
        interactionId,
        registration: {
          webinarId: webinar.id,
        },
      },
      select: {
        selectedOptions: true,
        registrationId: true,
      },
    })

    // Get user's own response
    const userResponse = sessionResponses.find(r => r.registrationId === registrationId)

    // Calculate this webinar's results
    const sessionOptionCounts: Record<number, number> = {}
    options.forEach((_, idx) => {
      sessionOptionCounts[idx] = 0
    })

    sessionResponses.forEach(response => {
      response.selectedOptions.forEach(optionIdx => {
        if (sessionOptionCounts[optionIdx] !== undefined) {
          sessionOptionCounts[optionIdx]++
        }
      })
    })

    const totalSessionResponses = sessionResponses.length

    // Get overall results (all webinars with this interaction - for templates)
    // For now, same as session since interactions are per-webinar
    // In the future, could aggregate across webinar templates

    // Build results object
    const results = options.map((option, idx) => ({
      option,
      index: idx,
      count: sessionOptionCounts[idx],
      percentage: totalSessionResponses > 0
        ? Math.round((sessionOptionCounts[idx] / totalSessionResponses) * 100)
        : 0,
    }))

    return successResponse({
      results: {
        options: results,
        totalResponses: totalSessionResponses,
        userResponse: userResponse?.selectedOptions || null,
        hasResponded: !!userResponse,
      },
    })
  } catch (error) {
    logger.error('Failed to get interaction results:', error)
    return errorResponse(error)
  }
}
