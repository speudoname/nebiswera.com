import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startChatBot, stopChatBot, getChatBotStatus } from '@/lib/webinar/chat-bot'
import { notFoundResponse, badRequestResponse, successResponse, errorResponse } from '@/lib'
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
      return notFoundResponse('Webinar not found')
    }

    if (action === 'start') {
      // Validate chat script
      if (!webinar.chatScript) {
        return badRequestResponse('No chat script configured for this webinar')
      }

      const script = webinar.chatScript as unknown as ChatBotScript

      if (!script.enabled) {
        return badRequestResponse('Chat script is disabled')
      }

      // Start chat bot
      const startTime = sessionStartTime ? new Date(sessionStartTime) : new Date()
      const result = startChatBot(webinar.id, script, startTime)

      if (!result.success) {
        return badRequestResponse(result.error || 'Failed to start chat bot')
      }

      return successResponse({
        success: true,
        message: 'Chat bot started',
        status: getChatBotStatus(webinar.id),
      })
    } else if (action === 'stop') {
      // Stop chat bot
      stopChatBot(webinar.id)

      return successResponse({
        success: true,
        message: 'Chat bot stopped',
      })
    } else {
      return badRequestResponse('Invalid action. Use "start" or "stop"')
    }
  } catch (error) {
    console.error('Failed to manage chat bot:', error)
    return errorResponse('Failed to manage chat bot')
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
      return notFoundResponse('Webinar not found')
    }

    const status = getChatBotStatus(webinar.id)
    const script = webinar.chatScript as ChatBotScript | null

    return successResponse({
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
    return errorResponse('Failed to get chat bot status')
  }
}
