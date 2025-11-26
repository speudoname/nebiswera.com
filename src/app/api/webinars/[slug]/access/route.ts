import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken, markAsAttended, updateWatchProgress } from '@/lib/webinar/registration'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/webinars/[slug]/access?token=xxx - Validate access and get webinar data
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 })
  }

  try {
    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      include: {
        scheduleConfig: true,
        interactions: {
          where: { enabled: true },
          orderBy: { triggersAt: 'asc' },
        },
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Validate access token
    const validation = await validateAccessToken(webinar.id, token)

    if (!validation.valid || !validation.registration) {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 })
    }

    const registration = validation.registration

    // Check if replay access is allowed
    if (registration.sessionType === 'REPLAY') {
      // Check if replay is enabled for this webinar
      if (webinar.scheduleConfig && !webinar.scheduleConfig.replayEnabled) {
        return NextResponse.json({
          error: 'Replay is not available for this webinar',
          replayDisabled: true,
        }, { status: 403 })
      }

      // Check if replay has expired
      if (webinar.scheduleConfig?.replayExpiresAfterDays) {
        const session = registration.sessionId
          ? await prisma.webinarSession.findUnique({ where: { id: registration.sessionId } })
          : null

        if (session) {
          const sessionEnd = new Date(
            session.scheduledAt.getTime() + (webinar.videoDuration || 60) * 60 * 1000
          )
          const expirationDate = new Date(
            sessionEnd.getTime() + webinar.scheduleConfig.replayExpiresAfterDays * 24 * 60 * 60 * 1000
          )

          if (new Date() > expirationDate) {
            return NextResponse.json({
              error: 'Replay has expired',
              replayExpired: true,
              expiredAt: expirationDate.toISOString(),
            }, { status: 403 })
          }
        }
      }
    }

    // Check if session is still valid (for scheduled sessions)
    if (registration.sessionId) {
      const session = await prisma.webinarSession.findUnique({
        where: { id: registration.sessionId },
      })

      if (session) {
        // For scheduled sessions, check if we're within the viewing window
        const now = new Date()
        const sessionStart = new Date(session.scheduledAt)
        const sessionEnd = new Date(sessionStart.getTime() + (webinar.videoDuration || 60) * 60 * 1000)

        // Allow joining 5 minutes early
        const earlyAccess = new Date(sessionStart.getTime() - 5 * 60 * 1000)

        // For simulated live, only allow access during the session window
        if (session.type === 'SCHEDULED' || session.type === 'JUST_IN_TIME') {
          if (now < earlyAccess) {
            return NextResponse.json({
              error: 'Session has not started yet',
              startsAt: sessionStart.toISOString(),
              waitingRoom: true,
            }, { status: 403 })
          }
        }
      }
    }

    // Mark as attended if first time accessing
    await markAsAttended(registration.id)

    // Determine playback mode
    let playbackMode: 'simulated_live' | 'on_demand' | 'replay' = 'simulated_live'
    let allowSeeking = false
    let startPosition = 0

    switch (registration.sessionType) {
      case 'ON_DEMAND':
        playbackMode = 'on_demand'
        allowSeeking = true
        startPosition = registration.watchProgress > 0 ? registration.watchProgress : 0
        break
      case 'REPLAY':
        playbackMode = 'replay'
        allowSeeking = true
        startPosition = registration.watchProgress > 0 ? registration.watchProgress : 0
        break
      case 'SCHEDULED':
      case 'JUST_IN_TIME':
        playbackMode = 'simulated_live'
        allowSeeking = false
        // For simulated live, calculate position based on session start time
        if (registration.sessionId) {
          const session = await prisma.webinarSession.findUnique({
            where: { id: registration.sessionId },
          })
          if (session) {
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - session.scheduledAt.getTime()) / 1000)
            startPosition = Math.max(0, elapsed)
          }
        }
        break
    }

    // Prepare interactions (filter sensitive data)
    const interactions = webinar.interactions.map((i) => ({
      id: i.id,
      type: i.type,
      triggerTime: i.triggersAt,
      title: i.title,
      config: i.content,
    }))

    return NextResponse.json({
      access: {
        valid: true,
        registrationId: registration.id,
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        sessionType: registration.sessionType,
      },
      webinar: {
        id: webinar.id,
        title: webinar.title,
        description: webinar.description,
        videoUid: webinar.cloudflareVideoUid,
        duration: webinar.videoDuration,
        thumbnailUrl: webinar.thumbnailUrl,
      },
      playback: {
        mode: playbackMode,
        allowSeeking,
        startPosition,
        lastPosition: registration.watchProgress,
      },
      interactions,
      chat: {
        enabled: webinar.chatEnabled,
      },
    })
  } catch (error) {
    console.error('Access validation failed:', error)
    return NextResponse.json(
      { error: 'Failed to validate access' },
      { status: 500 }
    )
  }
}

// POST /api/webinars/[slug]/access - Update watch progress
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { token, progress, position, eventType } = body

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 })
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

    // Update progress if provided
    if (typeof progress === 'number' && typeof position === 'number') {
      await updateWatchProgress(registration.id, progress, position)
    }

    // Track analytics event if provided
    if (eventType) {
      await prisma.webinarAnalyticsEvent.create({
        data: {
          webinarId: webinar.id,
          registrationId: registration.id,
          eventType,
          metadata: {
            progress,
            position,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
