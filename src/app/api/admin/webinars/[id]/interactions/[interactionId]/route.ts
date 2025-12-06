import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { WebinarInteractionType, WebinarInteractionPosition } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; interactionId: string }>
}

// GET /api/admin/webinars/[id]/interactions/[interactionId] - Get single interaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, interactionId } = await params

  try {
    const interaction = await prisma.webinarInteraction.findUnique({
      where: {
        id: interactionId,
        webinarId: id,
      },
      include: {
        _count: {
          select: {
            pollResponses: true,
            events: true,
          },
        },
      },
    })

    if (!interaction) {
      return notFoundResponse('Interaction not found')
    }

    return NextResponse.json({
      interaction: {
        id: interaction.id,
        type: interaction.type,
        triggerTime: interaction.triggersAt,
        duration: interaction.duration,
        title: interaction.title,
        description: interaction.description,
        config: interaction.content,
        pauseVideo: interaction.pauseVideo,
        required: interaction.required,
        showOnReplay: interaction.showOnReplay,
        dismissable: interaction.dismissable,
        position: interaction.position,
        enabled: interaction.enabled,
        viewCount: interaction.viewCount,
        actionCount: interaction.actionCount,
        responseCount: interaction._count.pollResponses,
        eventCount: interaction._count.events,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch interaction:', error)
    return errorResponse('Failed to fetch interaction')
  }
}

// PATCH /api/admin/webinars/[id]/interactions/[interactionId] - Update interaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, interactionId } = await params

  try {
    // Verify interaction exists and belongs to this webinar
    const existing = await prisma.webinarInteraction.findUnique({
      where: {
        id: interactionId,
        webinarId: id,
      },
    })

    if (!existing) {
      return notFoundResponse('Interaction not found')
    }

    const body = await request.json()
    const {
      type,
      triggerTime,
      duration,
      title,
      description,
      config,
      pauseVideo,
      required,
      showOnReplay,
      dismissable,
      position,
      enabled,
      sortOrder,
    } = body

    // Validate type if provided
    if (type) {
      const validTypes: WebinarInteractionType[] = [
        'POLL',
        'QUESTION',
        'CTA',
        'DOWNLOAD',
        'FEEDBACK',
        'TIP',
        'SPECIAL_OFFER',
        'PAUSE',
        'QUIZ',
        'CONTACT_FORM',
      ]
      if (!validTypes.includes(type)) {
        return badRequestResponse('Invalid interaction type')
      }
    }

    // Validate position if provided
    if (position) {
      const validPositions: WebinarInteractionPosition[] = [
        'TOP_LEFT',
        'TOP_RIGHT',
        'BOTTOM_LEFT',
        'BOTTOM_RIGHT',
        'CENTER',
        'SIDEBAR',
        'FULL_OVERLAY',
      ]
      if (!validPositions.includes(position)) {
        return badRequestResponse('Invalid position')
      }
    }

    const interaction = await prisma.webinarInteraction.update({
      where: { id: interactionId },
      data: {
        ...(type && { type: type as WebinarInteractionType }),
        ...(triggerTime !== undefined && { triggersAt: triggerTime }),
        ...(duration !== undefined && { duration }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(config && { content: config }),
        ...(pauseVideo !== undefined && { pauseVideo }),
        ...(required !== undefined && { required }),
        ...(showOnReplay !== undefined && { showOnReplay }),
        ...(dismissable !== undefined && { dismissable }),
        ...(position && { position: position as WebinarInteractionPosition }),
        ...(enabled !== undefined && { enabled }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({
      interaction: {
        id: interaction.id,
        type: interaction.type,
        triggerTime: interaction.triggersAt,
        duration: interaction.duration,
        title: interaction.title,
        description: interaction.description,
        config: interaction.content,
        pauseVideo: interaction.pauseVideo,
        required: interaction.required,
        showOnReplay: interaction.showOnReplay,
        dismissable: interaction.dismissable,
        position: interaction.position,
        enabled: interaction.enabled,
        sortOrder: interaction.sortOrder,
      },
    })
  } catch (error) {
    logger.error('Failed to update interaction:', error)
    return errorResponse('Failed to update interaction')
  }
}

// DELETE /api/admin/webinars/[id]/interactions/[interactionId] - Delete interaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, interactionId } = await params

  try {
    // Verify interaction exists and belongs to this webinar
    const existing = await prisma.webinarInteraction.findUnique({
      where: {
        id: interactionId,
        webinarId: id,
      },
    })

    if (!existing) {
      return notFoundResponse('Interaction not found')
    }

    await prisma.webinarInteraction.delete({
      where: { id: interactionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete interaction:', error)
    return errorResponse('Failed to delete interaction')
  }
}
