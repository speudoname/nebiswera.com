import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { checkRateLimitByToken } from '@/lib/rate-limit'
import { unauthorizedResponse, notFoundResponse, successResponse, errorResponse } from '@/lib'
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
      return unauthorizedResponse('Access token required')
    }

    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Validate access token
    const validation = await validateAccessToken(webinar.id, token)

    if (!validation.valid || !validation.registration) {
      return unauthorizedResponse('Invalid access token')
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

    return successResponse({ success: true })
  } catch (error) {
    console.error('Failed to track analytics event:', error)
    return errorResponse(error)
  }
}
