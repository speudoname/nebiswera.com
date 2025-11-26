import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/lib/webinar/registration'
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
    return NextResponse.json({ error: 'Access token required' }, { status: 401 })
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
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Validate access
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
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
    console.error('Failed to get simulated messages:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}
