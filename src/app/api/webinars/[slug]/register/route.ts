import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { registerForWebinar } from '@/lib/webinar/registration'
import { getAvailableSessionsForRegistration } from '@/lib/webinar/session-generator'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/webinars/[slug]/register - Get available sessions for registration
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        videoDuration: true,
        status: true,
        scheduleConfig: {
          select: {
            eventType: true,
            onDemandEnabled: true,
            replayEnabled: true,
            justInTimeEnabled: true,
            justInTimeMinutes: true,
            useAttendeeTimezone: true,
          },
        },
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    if (webinar.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Webinar is not available for registration' },
        { status: 403 }
      )
    }

    // Get available sessions
    const availability = await getAvailableSessionsForRegistration(webinar.id)

    return NextResponse.json({
      webinar: {
        id: webinar.id,
        title: webinar.title,
        description: webinar.description,
        thumbnailUrl: webinar.thumbnailUrl,
        duration: webinar.videoDuration,
      },
      sessions: availability.sessions.map((s) => ({
        id: s.id,
        scheduledAt: s.scheduledAt.toISOString(),
        type: s.type,
      })),
      options: {
        onDemandAvailable: availability.onDemandAvailable,
        replayAvailable: availability.replayAvailable,
        justInTimeEnabled: webinar.scheduleConfig?.justInTimeEnabled || false,
        justInTimeMinutes: webinar.scheduleConfig?.justInTimeMinutes || 15,
        useAttendeeTimezone: webinar.scheduleConfig?.useAttendeeTimezone || false,
      },
    })
  } catch (error) {
    console.error('Failed to fetch registration options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration options' },
      { status: 500 }
    )
  }
}

// POST /api/webinars/[slug]/register - Register for a webinar
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true, status: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    if (webinar.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Webinar is not available for registration' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      sessionId,
      sessionType,
      timezone,
      source,
      utmParams,
    } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Process registration
    const result = await registerForWebinar(webinar.id, {
      email,
      firstName,
      lastName,
      sessionId,
      sessionType,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      source,
      utmParams,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return registration with access URL
    return NextResponse.json({
      success: true,
      registration: {
        id: result.registration!.id,
        email: result.registration!.email,
        sessionType: result.registration!.sessionType,
        accessUrl: `/webinar/${slug}/watch?token=${result.registration!.accessToken}`,
      },
    })
  } catch (error) {
    console.error('Registration failed:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
