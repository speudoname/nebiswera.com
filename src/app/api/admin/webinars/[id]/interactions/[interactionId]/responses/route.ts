import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; interactionId: string }>
}

// GET /api/admin/webinars/[id]/interactions/[interactionId]/responses
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, interactionId } = await params

  try {
    // Get the interaction details
    const interaction = await prisma.webinarInteraction.findUnique({
      where: { id: interactionId, webinarId: id },
      select: {
        id: true,
        type: true,
        title: true,
        triggersAt: true,
        viewCount: true,
        actionCount: true,
        content: true,
      },
    })

    if (!interaction) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
    }

    // Get all responses for this interaction
    const responses = await prisma.webinarPollResponse.findMany({
      where: {
        interactionId,
      },
      include: {
        registration: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            registeredAt: true,
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
    })

    // Get interaction events (clicks, views, etc.)
    const interactionEvents = await prisma.webinarInteractionEvent.findMany({
      where: {
        interactionId,
        eventType: 'CLICKED',
      },
      include: {
        registration: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            registeredAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const ctaClicks = interactionEvents

    // Extract data from content JSON
    const content = interaction.content as any
    const pollQuestion = content?.question || null
    const pollOptions = content?.options || null
    const ctaButtonText = content?.buttonText || content?.text || null
    const ctaButtonUrl = content?.url || null

    // Calculate response distribution for polls
    let distribution: Array<{ option: string; count: number; percentage: number }> = []
    if (interaction.type === 'POLL' && pollOptions) {
      const options = pollOptions as string[]
      const totalResponses = responses.length

      distribution = options.map((option, index) => {
        // Count how many responses include this option index
        const count = responses.filter((r) => r.selectedOptions.includes(index)).length
        return {
          option,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        }
      })
    }

    // Format responses
    const formattedResponses = responses.map((r) => ({
      id: r.id,
      user: {
        id: r.registration.id,
        email: r.registration.email,
        name: r.registration.firstName && r.registration.lastName
          ? `${r.registration.firstName} ${r.registration.lastName}`
          : r.registration.email,
        registeredAt: r.registration.registeredAt,
      },
      selectedOptions: r.selectedOptions,
      textResponse: r.textResponse,
      rating: r.rating,
      respondedAt: r.respondedAt,
    }))

    // Format CTA clicks
    const formattedCtaClicks = ctaClicks.map((click) => ({
      id: click.id,
      user: {
        id: click.registration.id,
        email: click.registration.email,
        name: click.registration.firstName && click.registration.lastName
          ? `${click.registration.firstName} ${click.registration.lastName}`
          : click.registration.email,
        registeredAt: click.registration.registeredAt,
      },
      clickedAt: click.createdAt,
    }))

    return NextResponse.json({
      interaction: {
        id: interaction.id,
        type: interaction.type,
        title: interaction.title,
        triggersAt: interaction.triggersAt,
        viewCount: interaction.viewCount,
        actionCount: interaction.actionCount,
        question: pollQuestion,
        options: pollOptions,
        ctaButtonText,
        ctaButtonUrl,
      },
      responses: formattedResponses,
      ctaClicks: formattedCtaClicks,
      distribution,
      stats: {
        totalViews: interaction.viewCount,
        totalResponses: interaction.type === 'POLL' ? responses.length : ctaClicks.length,
        engagementRate: interaction.viewCount > 0
          ? Math.round((interaction.actionCount / interaction.viewCount) * 100)
          : 0,
      },
    })
  } catch (error) {
    console.error('Failed to fetch interaction responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interaction responses' },
      { status: 500 }
    )
  }
}
