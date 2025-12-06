import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { logger } from '@/lib/logger'
import { unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/webinars/[slug]/chat/simulated - Get simulated messages for a time range
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const fromTime = parseInt(searchParams.get('from') || '0')
  const toTime = parseInt(searchParams.get('to') || '0')

  if (!token) {
    return unauthorizedResponse()
  }

  if (fromTime >= toTime) {
    return NextResponse.json({ messages: [] })
  }

  try {
    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Validate access
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid) {
      return unauthorizedResponse()
    }

    // Get simulated messages for this time range
    const messages = await prisma.webinarChatMessage.findMany({
      where: {
        webinarId: webinar.id,
        isSimulated: true,
        isHidden: false,
        appearsAt: {
          gt: fromTime,
          lte: toTime,
        },
      },
      orderBy: { appearsAt: 'asc' },
      select: {
        id: true,
        senderName: true,
        message: true,
        isFromModerator: true,
        isSimulated: true,
        appearsAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        ...m,
        // Use appearsAt time as "created" time for display consistency
        createdAt: new Date(Date.now() - ((toTime - (m.appearsAt || 0)) * 1000)).toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Failed to get simulated messages:', error)
    return errorResponse('Failed to get messages')
  }
}
