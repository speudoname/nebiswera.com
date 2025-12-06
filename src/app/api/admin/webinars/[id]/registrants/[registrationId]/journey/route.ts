import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; registrationId: string }>
}

// GET /api/admin/webinars/[id]/registrants/[registrationId]/journey
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, registrationId } = await params

  try {
    // Get registration details
    const registration = await prisma.webinarRegistration.findUnique({
      where: { id: registrationId, webinarId: id },
      include: {
        session: {
          select: {
            id: true,
            scheduledAt: true,
            type: true,
          },
        },
        webinar: {
          select: {
            id: true,
            title: true,
            slug: true,
            videoDuration: true,
            completionPercent: true,
          },
        },
      },
    })

    if (!registration) {
      return notFoundResponse('Registration not found')
    }

    // Get all analytics events for this user
    const events = await prisma.webinarAnalyticsEvent.findMany({
      where: {
        registrationId,
        webinarId: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        metadata: true,
      },
    })

    // Get poll responses
    const pollResponses = await prisma.webinarPollResponse.findMany({
      where: {
        registrationId,
      },
      include: {
        interaction: {
          select: {
            id: true,
            title: true,
            type: true,
            triggersAt: true,
            content: true,
          },
        },
      },
      orderBy: {
        respondedAt: 'asc',
      },
    })

    // Get chat messages
    const chatMessages = await prisma.webinarChatMessage.findMany({
      where: {
        registrationId,
        webinarId: id,
        isSimulated: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
      },
    })

    // Calculate watch progress over time
    const videoEvents = events.filter((e) =>
      ['VIDEO_STARTED', 'VIDEO_PLAYED', 'VIDEO_PAUSED', 'VIDEO_SEEKED'].includes(e.eventType)
    )

    // Calculate engagement metrics
    // Note: Using ATTENDANCE and LEFT_EARLY as proxies for session join/exit
    const sessionJoinEvent = events.find((e) => e.eventType === 'ATTENDANCE')
    const sessionExitEvent = events.find((e) => e.eventType === 'LEFT_EARLY')
    const firstInteractionEvent = events.find((e) => ['POLL_ANSWERED', 'CTA_CLICKED', 'CHAT_SENT'].includes(e.eventType))

    const videoDuration = registration.webinar.videoDuration || 0
    const watchPercentage = videoDuration > 0
      ? Math.round((registration.maxVideoPosition / videoDuration) * 100)
      : 0

    // Build timeline combining all events
    const timeline: Array<{
      id: string
      type: 'EVENT' | 'POLL' | 'CHAT'
      eventType?: string
      title: string
      description?: string
      timestamp: Date
      metadata?: unknown
    }> = []

    // Add analytics events
    events.forEach((event) => {
      let title = event.eventType.replace(/_/g, ' ').toLowerCase()
      title = title.charAt(0).toUpperCase() + title.slice(1)

      timeline.push({
        id: event.id,
        type: 'EVENT',
        eventType: event.eventType,
        title,
        description: getEventDescription(event.eventType, event.metadata),
        timestamp: event.createdAt,
        metadata: event.metadata,
      })
    })

    // Add poll responses
    pollResponses.forEach((response) => {
      timeline.push({
        id: response.id,
        type: 'POLL',
        title: `Answered: ${response.interaction.title}`,
        description: response.textResponse || (response.selectedOptions.length > 0 ? `Selected ${response.selectedOptions.length} options` : 'Response submitted'),
        timestamp: response.respondedAt,
        metadata: {
          interactionId: response.interaction.id,
          triggersAt: response.interaction.triggersAt,
        },
      })
    })

    // Add chat messages
    chatMessages.forEach((chat) => {
      timeline.push({
        id: chat.id,
        type: 'CHAT',
        title: 'Sent chat message',
        description: chat.message,
        timestamp: chat.createdAt,
      })
    })

    // Sort timeline by timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Calculate session duration
    let sessionDurationSeconds = 0
    if (sessionJoinEvent && sessionExitEvent) {
      sessionDurationSeconds = Math.floor(
        (new Date(sessionExitEvent.createdAt).getTime() - new Date(sessionJoinEvent.createdAt).getTime()) / 1000
      )
    }

    // Calculate time to first interaction
    let timeToFirstInteraction = null
    if (sessionJoinEvent && firstInteractionEvent) {
      timeToFirstInteraction = Math.floor(
        (new Date(firstInteractionEvent.createdAt).getTime() - new Date(sessionJoinEvent.createdAt).getTime()) / 1000
      )
    }

    return NextResponse.json({
      registration: {
        id: registration.id,
        email: registration.email,
        firstName: registration.firstName,
        lastName: registration.lastName,
        registeredAt: registration.registeredAt,
        joinedAt: registration.joinedAt,
        completedAt: registration.completedAt,
        source: registration.source,
        utmSource: registration.utmSource,
        utmMedium: registration.utmMedium,
        utmCampaign: registration.utmCampaign,
        engagementScore: registration.engagementScore,
        maxVideoPosition: registration.maxVideoPosition,
        watchPercentage,
        ctaClickCount: registration.ctaClickCount,
        session: registration.session,
      },
      webinar: {
        id: registration.webinar.id,
        title: registration.webinar.title,
        slug: registration.webinar.slug,
        videoDuration: registration.webinar.videoDuration,
      },
      metrics: {
        totalEvents: events.length,
        pollResponses: pollResponses.length,
        chatMessages: chatMessages.length,
        videoEvents: videoEvents.length,
        sessionDurationSeconds,
        timeToFirstInteraction,
        completed: registration.completedAt !== null,
      },
      timeline,
    })
  } catch (error) {
    logger.error('Failed to fetch user journey:', error)
    return errorResponse('Failed to fetch user journey')
  }
}

function getEventDescription(eventType: string, metadata: unknown): string {
  const meta = metadata as Record<string, unknown> | null

  switch (eventType) {
    case 'SESSION_JOINED':
      if (meta?.lateArrival) {
        return `Joined ${meta.lateBySeconds}s late`
      }
      return meta?.playbackMode ? `Playback mode: ${meta.playbackMode}` : 'Joined session'

    case 'SESSION_EXITED':
      if (meta?.bounce) return 'Bounced (< 30s)'
      if (meta?.earlyExit) return `Left early (${meta.watchPercent}% watched)`
      if (meta?.completed) return 'Completed session'
      return 'Exited session'

    case 'VIDEO_STARTED':
      return meta?.playbackMode ? `Started watching (${meta.playbackMode})` : 'Started watching'

    case 'VIDEO_PAUSED':
      return meta?.currentPosition ? `Paused at ${Math.floor(Number(meta.currentPosition))}s` : 'Paused video'

    case 'VIDEO_SEEKED':
      return meta?.fromPosition && meta?.toPosition
        ? `Seeked from ${Math.floor(Number(meta.fromPosition))}s to ${Math.floor(Number(meta.toPosition))}s`
        : 'Seeked in video'

    case 'FIRST_INTERACTION':
      return meta?.timeToInteractionSeconds
        ? `First interaction after ${Math.floor(Number(meta.timeToInteractionSeconds))}s`
        : 'First interaction'

    case 'END_SCREEN_VIEWED':
      return 'Reached end screen'

    case 'END_SCREEN_CTA_CLICKED':
      return meta?.buttonText ? `Clicked: ${meta.buttonText}` : 'Clicked CTA'

    case 'END_SCREEN_REDIRECTED':
      return meta?.automatic ? 'Auto-redirected' : 'Manually redirected'

    default:
      return ''
  }
}
