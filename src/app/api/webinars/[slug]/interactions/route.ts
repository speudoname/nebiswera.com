import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { logger } from '@/lib/logger'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/webinars/[slug]/interactions - Submit interaction response
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { token, interactionId, response } = body

    if (!token) {
      return unauthorizedResponse()
    }

    if (!interactionId) {
      return badRequestResponse('Interaction ID required')
    }

    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Validate access
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid || !validation.registration) {
      return unauthorizedResponse()
    }

    const registration = validation.registration

    // Find interaction
    const interaction = await prisma.webinarInteraction.findFirst({
      where: {
        id: interactionId,
        webinarId: webinar.id,
      },
    })

    if (!interaction) {
      return notFoundResponse('Interaction not found')
    }

    // Track the interaction event
    await prisma.webinarInteractionEvent.create({
      data: {
        interactionId,
        registrationId: registration.id,
        eventType: 'RESPONDED',
        metadata: response,
      },
    })

    // Update interaction stats
    await prisma.webinarInteraction.update({
      where: { id: interactionId },
      data: {
        actionCount: { increment: 1 },
      },
    })

    // Handle specific interaction types
    if (interaction.type === 'POLL' && response?.selectedOptions) {
      // Check if already responded
      const existingResponse = await prisma.webinarPollResponse.findUnique({
        where: {
          interactionId_registrationId: {
            interactionId,
            registrationId: registration.id,
          },
        },
      })

      if (!existingResponse) {
        await prisma.webinarPollResponse.create({
          data: {
            interactionId,
            registrationId: registration.id,
            selectedOptions: response.selectedOptions,
          },
        })
      }

      // Track analytics
      await prisma.webinarAnalyticsEvent.create({
        data: {
          webinarId: webinar.id,
          registrationId: registration.id,
          eventType: 'POLL_ANSWERED',
          metadata: {
            interactionId,
            selectedOptions: response.selectedOptions,
          },
        },
      })
    } else if (interaction.type === 'CTA' && response?.clicked) {
      await prisma.webinarAnalyticsEvent.create({
        data: {
          webinarId: webinar.id,
          registrationId: registration.id,
          eventType: 'CTA_CLICKED',
          metadata: {
            interactionId,
            interactionTitle: interaction.title,
          },
        },
      })
    } else if (interaction.type === 'DOWNLOAD' && response?.downloaded) {
      await prisma.webinarAnalyticsEvent.create({
        data: {
          webinarId: webinar.id,
          registrationId: registration.id,
          eventType: 'DOWNLOAD_CLICKED',
          metadata: {
            interactionId,
            interactionTitle: interaction.title,
          },
        },
      })
    } else if (interaction.type === 'FEEDBACK' && response?.rating) {
      // Save feedback rating
      await prisma.webinarPollResponse.upsert({
        where: {
          interactionId_registrationId: {
            interactionId,
            registrationId: registration.id,
          },
        },
        create: {
          interactionId,
          registrationId: registration.id,
          rating: response.rating,
        },
        update: {
          rating: response.rating,
        },
      })

      await prisma.webinarAnalyticsEvent.create({
        data: {
          webinarId: webinar.id,
          registrationId: registration.id,
          eventType: 'FEEDBACK_GIVEN',
          metadata: {
            interactionId,
            rating: response.rating,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to submit interaction response:', error)
    return errorResponse('Failed to submit response')
  }
}

// GET /api/webinars/[slug]/interactions - Get poll results (for showing aggregated responses)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const interactionId = searchParams.get('interactionId')

  if (!token) {
    return unauthorizedResponse()
  }

  try {
    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Validate access
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid) {
      return unauthorizedResponse()
    }

    // Get poll results for a specific interaction
    if (interactionId) {
      const interaction = await prisma.webinarInteraction.findFirst({
        where: { id: interactionId, webinarId: webinar.id },
      })

      if (!interaction) {
        return notFoundResponse('Interaction not found')
      }

      const responses = await prisma.webinarPollResponse.findMany({
        where: { interactionId },
        select: { selectedOptions: true },
      })

      // Aggregate poll results
      const config = interaction.content as { options?: string[] }
      const optionCounts: Record<number, number> = {}

      for (const response of responses) {
        for (const optionIndex of response.selectedOptions) {
          optionCounts[optionIndex] = (optionCounts[optionIndex] || 0) + 1
        }
      }

      const totalResponses = responses.length

      return NextResponse.json({
        interaction: {
          id: interaction.id,
          type: interaction.type,
          title: interaction.title,
        },
        results: {
          totalResponses,
          options: config.options?.map((option, index) => ({
            label: option,
            count: optionCounts[index] || 0,
            percentage: totalResponses > 0
              ? Math.round(((optionCounts[index] || 0) / totalResponses) * 100)
              : 0,
          })),
        },
      })
    }

    // Return all interactions for this webinar
    const interactionsData = await prisma.webinarInteraction.findMany({
      where: {
        webinarId: webinar.id,
        enabled: true,
      },
      orderBy: { triggersAt: 'asc' },
      select: {
        id: true,
        type: true,
        triggersAt: true,
        title: true,
        content: true,
        viewCount: true,
        actionCount: true,
      },
    })

    // Map to API response format
    const interactions = interactionsData.map((i) => ({
      id: i.id,
      type: i.type,
      triggerTime: i.triggersAt,
      title: i.title,
      config: i.content,
      viewCount: i.viewCount,
      actionCount: i.actionCount,
    }))

    return NextResponse.json({ interactions })
  } catch (error) {
    logger.error('Failed to get interactions:', error)
    return errorResponse('Failed to get interactions')
  }
}
