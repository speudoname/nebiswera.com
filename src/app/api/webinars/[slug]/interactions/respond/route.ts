import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { checkRateLimitByToken } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/webinars/[slug]/interactions/respond - Save user response to interaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { token, interactionId, response, eventType } = body

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 })
    }

    if (!interactionId) {
      return NextResponse.json({ error: 'Interaction ID required' }, { status: 400 })
    }

    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Validate access token
    const validation = await validateAccessToken(webinar.id, token)

    if (!validation.valid || !validation.registration) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    const registration = validation.registration

    // Rate limiting: 100 interactions per minute per user (reuses analytics limiter)
    const rateLimitResponse = await checkRateLimitByToken(token, 'analytics')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Verify interaction belongs to this webinar
    const interaction = await prisma.webinarInteraction.findFirst({
      where: {
        id: interactionId,
        webinarId: webinar.id,
      },
    })

    if (!interaction) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
    }

    // Handle different event types
    switch (eventType) {
      case 'VIEWED':
        // Track that user saw the interaction
        await prisma.webinarInteractionEvent.create({
          data: {
            interactionId,
            registrationId: registration.id,
            eventType: 'VIEWED',
          },
        })

        // Increment view count
        await prisma.webinarInteraction.update({
          where: { id: interactionId },
          data: { viewCount: { increment: 1 } },
        })
        break

      case 'RESPONDED':
        // Save the actual response
        if (interaction.type === 'POLL' || interaction.type === 'QUIZ') {
          // For polls/quizzes - save selected options
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
              selectedOptions: response.selectedOptions || [],
            },
            update: {
              selectedOptions: response.selectedOptions || [],
            },
          })
        } else if (interaction.type === 'QUESTION') {
          // For open questions - save text response
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
              textResponse: response.textResponse || '',
            },
            update: {
              textResponse: response.textResponse || '',
            },
          })
        } else if (interaction.type === 'FEEDBACK') {
          // For feedback - save rating
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
              rating: response.rating || 0,
            },
            update: {
              rating: response.rating || 0,
            },
          })
        } else if (interaction.type === 'CONTACT_FORM') {
          // For contact forms - save as text response (JSON stringified)
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
              textResponse: JSON.stringify(response.formData || {}),
            },
            update: {
              textResponse: JSON.stringify(response.formData || {}),
            },
          })
        }

        // Track responded event
        await prisma.webinarInteractionEvent.create({
          data: {
            interactionId,
            registrationId: registration.id,
            eventType: 'RESPONDED',
            metadata: response,
          },
        })

        // Increment action count
        await prisma.webinarInteraction.update({
          where: { id: interactionId },
          data: { actionCount: { increment: 1 } },
        })
        break

      case 'CLICKED':
        // Track CTA/link clicks
        await prisma.webinarInteractionEvent.create({
          data: {
            interactionId,
            registrationId: registration.id,
            eventType: 'CLICKED',
            metadata: response,
          },
        })

        // Increment action count
        await prisma.webinarInteraction.update({
          where: { id: interactionId },
          data: { actionCount: { increment: 1 } },
        })
        break

      case 'DISMISSED':
        // Track dismissal
        await prisma.webinarInteractionEvent.create({
          data: {
            interactionId,
            registrationId: registration.id,
            eventType: 'DISMISSED',
          },
        })
        break

      case 'DOWNLOADED':
        // Track download
        await prisma.webinarInteractionEvent.create({
          data: {
            interactionId,
            registrationId: registration.id,
            eventType: 'DOWNLOADED',
            metadata: response,
          },
        })

        // Increment action count
        await prisma.webinarInteraction.update({
          where: { id: interactionId },
          data: { actionCount: { increment: 1 } },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save interaction response:', error)
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    )
  }
}
