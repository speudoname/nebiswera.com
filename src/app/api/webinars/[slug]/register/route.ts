import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { registerForWebinar } from '@/app/api/webinars/lib/registration'
import { getAvailableSessionsForRegistration } from '@/app/api/webinars/lib/session-generator'
import { checkRateLimit } from '@/lib/rate-limit'
import { notFoundResponse, forbiddenResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
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
            intervalMinutes: true,
            useAttendeeTimezone: true,
          },
        },
      },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    if (webinar.status !== 'PUBLISHED') {
      return forbiddenResponse('Webinar is not available for registration')
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
        intervalMinutes: webinar.scheduleConfig?.intervalMinutes || 15,
        useAttendeeTimezone: webinar.scheduleConfig?.useAttendeeTimezone || false,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch registration options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration options' },
      { status: 500 }
    )
  }
}

// POST /api/webinars/[slug]/register - Register for a webinar
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  // Rate limiting: 5 registrations per hour per IP
  const rateLimitResponse = await checkRateLimit(request, 'registration')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true, status: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    if (webinar.status !== 'PUBLISHED') {
      return forbiddenResponse('Webinar is not available for registration')
    }

    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      phone,
      customFieldResponses,
      sessionId,
      sessionType,
      timezone,
      source,
      utmParams,
    } = body

    // Validate required fields
    if (!email) {
      return badRequestResponse('Email is required')
    }

    // Process registration
    const result = await registerForWebinar(webinar.id, {
      email,
      firstName,
      lastName,
      phone,
      customFieldResponses,
      sessionId,
      sessionType,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      source,
      utmParams,
    })

    if (!result.success) {
      return badRequestResponse(result.error || 'Registration failed')
    }

    // Return registration with access URL
    return successResponse({
      success: true,
      registration: {
        id: result.registration!.id,
        email: result.registration!.email,
        sessionType: result.registration!.sessionType,
        accessToken: result.registration!.accessToken,
        accessUrl: `/webinar/${slug}/watch?token=${result.registration!.accessToken}`,
      },
    })
  } catch (error) {
    logger.error('Registration failed:', error)
    return errorResponse(error)
  }
}
