import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { publishChatMessage } from '@/lib/ably'
import { checkRateLimitByToken } from '@/lib/rate-limit'
import { CHAT } from '@/lib/webinar/constants'
import { unauthorizedResponse, notFoundResponse, forbiddenResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
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
      return unauthorizedResponse('Access token required')
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return badRequestResponse('Message is required')
    }

    // Validate message length
    if (message.length > CHAT.MESSAGE_MAX_LENGTH) {
      return badRequestResponse(`Message too long (max ${CHAT.MESSAGE_MAX_LENGTH} characters)`)
    }

    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true, chatEnabled: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    if (!webinar.chatEnabled) {
      return forbiddenResponse('Chat is disabled for this webinar')
    }

    // Validate access
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid || !validation.registration) {
      return unauthorizedResponse('Invalid access token')
    }

    const registration = validation.registration

    // Rate limiting: 20 messages per minute per user
    const rateLimitResponse = await checkRateLimitByToken(token, 'chat')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

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

    // Publish to Ably for real-time distribution
    try {
      await publishChatMessage(webinar.id, {
        id: chatMessage.id,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        isFromModerator: chatMessage.isFromModerator,
        isSimulated: chatMessage.isSimulated,
        createdAt: chatMessage.createdAt.toISOString(),
      })
    } catch (ablyError) {
      // Log error but don't fail the request - message is saved to DB
      logger.error('Failed to publish to Ably (message saved to DB):', ablyError)
    }

    return successResponse({
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
    logger.error('Failed to send chat message:', error)
    return errorResponse('Failed to send message')
  }
}

// GET /api/webinars/[slug]/chat - Get recent chat messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const since = searchParams.get('since') // ISO date string

  if (!token) {
    return unauthorizedResponse('Access token required')
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
      return unauthorizedResponse('Invalid access token')
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

    return successResponse({
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Failed to get chat messages:', error)
    return errorResponse('Failed to get messages')
  }
}
