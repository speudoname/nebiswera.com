import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/webinars/[slug]/chat - Send a chat message
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { token, message } = body

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Validate message length
    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 characters)' }, { status: 400 })
    }

    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true, chatEnabled: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    if (!webinar.chatEnabled) {
      return NextResponse.json({ error: 'Chat is disabled for this webinar' }, { status: 403 })
    }

    // Validate access
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid || !validation.registration) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    const registration = validation.registration

    // Create chat message
    const chatMessage = await prisma.webinarChatMessage.create({
      data: {
        webinarId: webinar.id,
        registrationId: registration.id,
        senderName: registration.firstName || registration.email.split('@')[0],
        message: message.trim(),
        isSimulated: false,
        isFromModerator: false,
      },
    })

    // Track analytics event
    await prisma.webinarAnalyticsEvent.create({
      data: {
        webinarId: webinar.id,
        registrationId: registration.id,
        eventType: 'CHAT_SENT',
        metadata: { messageId: chatMessage.id },
      },
    })

    // TODO: Publish to Redis for real-time distribution
    // For now, clients will receive via polling or next SSE cycle

    return NextResponse.json({
      success: true,
      message: {
        id: chatMessage.id,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        isFromModerator: chatMessage.isFromModerator,
        isSimulated: chatMessage.isSimulated,
        createdAt: chatMessage.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to send chat message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// GET /api/webinars/[slug]/chat - Get recent chat messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const since = searchParams.get('since') // ISO date string

  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 })
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

    // Get messages
    const messages = await prisma.webinarChatMessage.findMany({
      where: {
        webinarId: webinar.id,
        isHidden: false,
        ...(since && { createdAt: { gt: new Date(since) } }),
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Limit to recent messages
      select: {
        id: true,
        senderName: true,
        message: true,
        isFromModerator: true,
        isSimulated: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to get chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}
