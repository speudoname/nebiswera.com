import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken, markAsAttended } from '@/app/api/webinars/lib/registration'
import { determineAccessState } from '@/lib/webinar/access-state'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/webinars/[slug]/access?token=xxx
 * Validate access and get webinar data
 *
 * Refactored to use state machine for clearer logic
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 })
  }

  try {
    // ===========================================
    // 1. Fetch webinar and validate token
    // ===========================================
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

    const validation = await validateAccessToken(webinar.id, token)

    if (!validation.valid || !validation.registration) {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 })
    }

    const registration = validation.registration

    // ===========================================
    // 2. Fetch session if applicable
    // ===========================================
    let session = null
    if (registration.sessionId) {
      session = await prisma.webinarSession.findUnique({
        where: { id: registration.sessionId },
      })
    }

    // ===========================================
    // 3. Determine access state (State Machine)
    // ===========================================
    const state = determineAccessState(webinar, registration, session)

    // ===========================================
    // 4. Handle state responses
    // ===========================================
    switch (state.status) {
      case 'ALLOWED':
        // Mark as attended
        await markAsAttended(registration.id)

        // Prepare interactions
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
            sessionType: state.sessionType,
          },
          webinar: {
            id: webinar.id,
            title: webinar.title,
            description: webinar.description,
            hlsUrl: webinar.hlsUrl,
            duration: webinar.videoDuration,
            thumbnailUrl: webinar.thumbnailUrl,
            chatEnabled: webinar.chatEnabled,
          },
          playback: {
            mode: state.playbackMode,
            allowSeeking: state.allowSeeking,
            startPosition: state.startPosition,
          },
          interactions,
          session: session
            ? {
                id: session.id,
                scheduledAt: session.scheduledAt.toISOString(),
                type: session.type,
              }
            : null,
        })

      case 'WAITING':
        return NextResponse.json(
          {
            error: 'Session has not started yet',
            startsAt: state.startsAt.toISOString(),
            minutesUntilStart: state.minutesUntilStart,
            waitingRoom: true,
          },
          { status: 403 }
        )

      case 'ENDED':
        // Auto-convert to replay if available
        if (state.replayAvailable) {
          await prisma.webinarRegistration.update({
            where: { id: registration.id },
            data: { sessionType: 'REPLAY' },
          })

          // Recursively call state machine with updated registration
          registration.sessionType = 'REPLAY'
          const replayState = determineAccessState(webinar, registration, session)

          if (replayState.status === 'ALLOWED') {
            await markAsAttended(registration.id)

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
                sessionType: 'REPLAY',
              },
              webinar: {
                id: webinar.id,
                title: webinar.title,
                description: webinar.description,
                hlsUrl: webinar.hlsUrl,
                duration: webinar.videoDuration,
                thumbnailUrl: webinar.thumbnailUrl,
                chatEnabled: webinar.chatEnabled,
              },
              playback: {
                mode: replayState.playbackMode,
                allowSeeking: replayState.allowSeeking,
                startPosition: replayState.startPosition,
              },
              interactions,
              session: session
                ? {
                    id: session.id,
                    scheduledAt: session.scheduledAt.toISOString(),
                    type: session.type,
                  }
                : null,
              convertedToReplay: true,
            })
          }
        }

        // No replay available
        return NextResponse.json(
          {
            error: 'This session has ended',
            sessionEnded: true,
            endedAt: state.endedAt.toISOString(),
            replayAvailable: false,
          },
          { status: 403 }
        )

      case 'EXPIRED':
        if (state.reason === 'replay_disabled') {
          return NextResponse.json(
            {
              error: 'Replay is not available for this webinar',
              replayDisabled: true,
            },
            { status: 403 }
          )
        } else {
          return NextResponse.json(
            {
              error: 'Replay has expired',
              replayExpired: true,
              expiredAt: state.expiredAt.toISOString(),
            },
            { status: 403 }
          )
        }

      case 'DISABLED':
        return NextResponse.json(
          {
            error: state.reason,
            accessDisabled: true,
          },
          { status: 403 }
        )

      default:
        return NextResponse.json(
          {
            error: 'Unable to determine access state',
          },
          { status: 500 }
        )
    }
  } catch (error) {
    console.error('Access check failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to validate access',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/webinars/[slug]/access - Update watch progress
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { token, progress, currentTime } = body

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 })
    }

    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Validate token
    const validation = await validateAccessToken(webinar.id, token)

    if (!validation.valid || !validation.registration) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    // Update progress
    await prisma.webinarRegistration.update({
      where: { id: validation.registration.id },
      data: {
        maxVideoPosition: currentTime || 0,
        lastActiveAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update progress:', error)
    return NextResponse.json(
      { error: 'Failed to update watch progress' },
      { status: 500 }
    )
  }
}
