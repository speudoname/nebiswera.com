import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startChatBot, stopChatBot, getChatBotStatus } from '@/lib/webinar/chat-bot'
import type { NextRequest } from 'next/server'
import type { ChatBotScript } from '@/lib/webinar/chat-bot'

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * POST /api/webinars/[slug]/chat-bot - Start chat bot for a session
 * Body: { action: 'start' | 'stop', sessionStartTime?: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    const body = await request.json()
    const { action, sessionStartTime } = body

    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: {
        id: true,
        chatScript: true,
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    if (action === 'start') {
      // Validate chat script
      if (!webinar.chatScript) {
        return NextResponse.json(
          { error: 'No chat script configured for this webinar' },
          { status: 400 }
        )
      }

      const script = webinar.chatScript as unknown as ChatBotScript

      if (!script.enabled) {
        return NextResponse.json(
          { error: 'Chat script is disabled' },
          { status: 400 }
        )
      }

      // Start chat bot
      const startTime = sessionStartTime ? new Date(sessionStartTime) : new Date()
      const result = startChatBot(webinar.id, script, startTime)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to start chat bot' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Chat bot started',
        status: getChatBotStatus(webinar.id),
      })
    } else if (action === 'stop') {
      // Stop chat bot
      stopChatBot(webinar.id)

      return NextResponse.json({
        success: true,
        message: 'Chat bot stopped',
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "start" or "stop"' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to manage chat bot:', error)
    return NextResponse.json(
      { error: 'Failed to manage chat bot' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webinars/[slug]/chat-bot - Get chat bot status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: {
        id: true,
        chatScript: true,
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const status = getChatBotStatus(webinar.id)
    const script = webinar.chatScript as ChatBotScript | null

    return NextResponse.json({
      status,
      script: script
        ? {
            enabled: script.enabled,
            messageCount: script.messages?.length || 0,
          }
        : null,
    })
  } catch (error) {
    console.error('Failed to get chat bot status:', error)
    return NextResponse.json(
      { error: 'Failed to get chat bot status' },
      { status: 500 }
    )
  }
}
