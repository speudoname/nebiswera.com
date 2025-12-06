import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { WebinarInteractionType, WebinarInteractionPosition } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; interactionId: string }>
}

// GET /api/admin/webinars/[id]/interactions/[interactionId] - Get single interaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
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
    return NextResponse.json(
      { error: 'Failed to fetch interaction' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/webinars/[id]/interactions/[interactionId] - Update interaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
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
        return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 })
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
        return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
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
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/webinars/[id]/interactions/[interactionId] - Delete interaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
    }

    await prisma.webinarInteraction.delete({
      where: { id: interactionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    )
  }
}
