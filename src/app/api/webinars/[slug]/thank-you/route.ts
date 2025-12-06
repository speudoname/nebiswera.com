import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { badRequestResponse, notFoundResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/webinars/[slug]/thank-you?token=xxx - Get registration details for thank you page
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return badRequestResponse('Access token required')
  }

  try {
    // Find registration by token
    const registration = await prisma.webinarRegistration.findFirst({
      where: {
        accessToken: token,
        webinar: { slug },
      },
      include: {
        webinar: {
          select: {
            title: true,
            customThankYouPageHtml: true,
          },
        },
      },
    })

    if (!registration) {
      return notFoundResponse('Invalid access token')
    }

    return NextResponse.json({
      webinarTitle: registration.webinar.title,
      email: registration.email,
      firstName: registration.firstName,
      lastName: registration.lastName,
      sessionType: registration.sessionType,
      sessionScheduledAt: registration.sessionStartTime,
      customThankYouHtml: registration.webinar.customThankYouPageHtml,
    })
  } catch (error) {
    logger.error('Failed to fetch thank you page data:', error)
    return errorResponse('Failed to load registration details')
  }
}
