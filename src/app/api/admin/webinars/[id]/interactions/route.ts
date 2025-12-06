import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { WebinarInteractionType, WebinarInteractionPosition } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/interactions - List all interactions
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const interactions = await prisma.webinarInteraction.findMany({
      where: { webinarId: id },
      orderBy: { triggersAt: 'asc' },
    })

    return NextResponse.json({
      interactions: interactions.map((i) => ({
        id: i.id,
        type: i.type,
        triggerTime: i.triggersAt,
        duration: i.duration,
        title: i.title,
        config: i.content,
        pauseVideo: i.pauseVideo,
        required: i.required,
        showOnReplay: i.showOnReplay,
        position: i.position,
        enabled: i.enabled,
        viewCount: i.viewCount,
        actionCount: i.actionCount,
      })),
    })
  } catch (error) {
    logger.error('Failed to fetch interactions:', error)
    return errorResponse('Failed to fetch interactions')
  }
}

// POST /api/admin/webinars/[id]/interactions - Create a new interaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
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

    // Validate type
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

    // Validate position
    const validPositions: WebinarInteractionPosition[] = [
      'TOP_LEFT',
      'TOP_RIGHT',
      'BOTTOM_LEFT',
      'BOTTOM_RIGHT',
      'CENTER',
      'FULL_OVERLAY',
    ]
    if (position && !validPositions.includes(position)) {
      return badRequestResponse('Invalid position')
    }

    // Validate required fields
    if (!title || typeof triggerTime !== 'number') {
      return badRequestResponse('Title and trigger time are required')
    }

    const interaction = await prisma.webinarInteraction.create({
      data: {
        webinarId: id,
        type: type as WebinarInteractionType,
        triggersAt: triggerTime,
        duration: duration || null,
        title,
        content: config || {},
        pauseVideo: pauseVideo || false,
        required: required || false,
        showOnReplay: showOnReplay !== false,
        position: (position as WebinarInteractionPosition) || 'BOTTOM_RIGHT',
        enabled: enabled !== false,
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
    logger.error('Failed to create interaction:', error)
    return errorResponse('Failed to create interaction')
  }
}
