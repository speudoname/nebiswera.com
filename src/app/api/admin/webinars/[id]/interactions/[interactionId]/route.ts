import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
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
    const interaction = await prisma.webinarInteraction.findFirst({
      where: {
        id: interactionId,
        webinarId: id,
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
        config: interaction.content,
        pauseVideo: interaction.pauseVideo,
        required: interaction.required,
        showOnReplay: interaction.showOnReplay,
        position: interaction.position,
        enabled: interaction.enabled,
        viewCount: interaction.viewCount,
        actionCount: interaction.actionCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch interaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interaction' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webinars/[id]/interactions/[interactionId] - Update interaction
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, interactionId } = await params

  try {
    // Verify interaction exists and belongs to webinar
    const existing = await prisma.webinarInteraction.findFirst({
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
      config,
      pauseVideo,
      required,
      showOnReplay,
      position,
      enabled,
    } = body

    // Validate type if provided
    const validTypes: WebinarInteractionType[] = [
      'POLL',
      'QUESTION',
      'CTA',
      'DOWNLOAD',
      'FEEDBACK',
      'TIP',
      'SPECIAL_OFFER',
    ]
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 })
    }

    // Validate position if provided
    const validPositions: WebinarInteractionPosition[] = [
      'TOP_LEFT',
      'TOP_RIGHT',
      'BOTTOM_LEFT',
      'BOTTOM_RIGHT',
      'CENTER',
      'FULL_OVERLAY',
    ]
    if (position && !validPositions.includes(position)) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
    }

    const interaction = await prisma.webinarInteraction.update({
      where: { id: interactionId },
      data: {
        ...(type && { type: type as WebinarInteractionType }),
        ...(typeof triggerTime === 'number' && { triggersAt: triggerTime }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(title && { title }),
        ...(config !== undefined && { content: config }),
        ...(typeof pauseVideo === 'boolean' && { pauseVideo }),
        ...(typeof required === 'boolean' && { required }),
        ...(typeof showOnReplay === 'boolean' && { showOnReplay }),
        ...(position && { position: position as WebinarInteractionPosition }),
        ...(typeof enabled === 'boolean' && { enabled }),
      },
    })

    return NextResponse.json({
      interaction: {
        id: interaction.id,
        type: interaction.type,
        triggerTime: interaction.triggersAt,
        duration: interaction.duration,
        title: interaction.title,
        config: interaction.content,
        pauseVideo: interaction.pauseVideo,
        required: interaction.required,
        showOnReplay: interaction.showOnReplay,
        position: interaction.position,
        enabled: interaction.enabled,
      },
    })
  } catch (error) {
    console.error('Failed to update interaction:', error)
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
    // Verify interaction exists and belongs to webinar
    const existing = await prisma.webinarInteraction.findFirst({
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
    console.error('Failed to delete interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    )
  }
}
