import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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
    return NextResponse.json({ error: 'Access token required' }, { status: 400 })
  }

  try {
    // Find registration by token
    const registration = await prisma.webinarRegistration.findFirst({
      where: {
        accessToken: token,
        webinar: { slug },
      },
      include: {
        webinar: true,
        session: {
          select: {
            scheduledAt: true,
            type: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 404 })
    }

    // Calculate sessionScheduledAt based on session type
    let sessionScheduledAt: Date | null = null

    switch (registration.sessionType) {
      case 'SCHEDULED':
        // Use actual scheduled time from session
        sessionScheduledAt = registration.session?.scheduledAt || null
        break

      case 'JUST_IN_TIME':
        // Calculate start time as NOW + justInTimeMinutes
        const now = new Date()
        const jitMinutes = (registration.webinar as any).justInTimeMinutes || 15
        sessionScheduledAt = new Date(now.getTime() + jitMinutes * 60 * 1000)
        break

      case 'ON_DEMAND':
      case 'REPLAY':
        // These should redirect immediately (no scheduled time)
        sessionScheduledAt = null
        break

      default:
        sessionScheduledAt = null
    }

    return NextResponse.json({
      webinarTitle: registration.webinar.title,
      email: registration.email,
      firstName: registration.firstName,
      lastName: registration.lastName,
      sessionType: registration.sessionType,
      sessionScheduledAt: sessionScheduledAt,
      customThankYouHtml: registration.webinar.customThankYouPageHtml,
    })
  } catch (error) {
    console.error('Failed to fetch thank you page data:', error)
    return NextResponse.json(
      { error: 'Failed to load registration details' },
      { status: 500 }
    )
  }
}
