import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { checkRateLimitByToken } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/webinars/[slug]/analytics - Track analytics events
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { token, eventType, metadata } = body

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

    // Rate limiting: 100 events per minute per user
    const rateLimitResponse = await checkRateLimitByToken(token, 'analytics')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Create analytics event
    await prisma.webinarAnalyticsEvent.create({
      data: {
        webinarId: webinar.id,
        registrationId: registration.id,
        sessionId: registration.sessionId,
        eventType,
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track analytics event:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    )
  }
}
