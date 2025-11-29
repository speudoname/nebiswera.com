import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/webinars/[slug]/chat/stream - SSE endpoint for real-time chat
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return new Response('Access token required', { status: 401 })
  }

  // Find webinar
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    select: { id: true, chatEnabled: true },
  })

  if (!webinar) {
    return new Response('Webinar not found', { status: 404 })
  }

  // Validate access
  const validation = await validateAccessToken(webinar.id, token)
  if (!validation.valid) {
    return new Response('Invalid access token', { status: 401 })
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  let lastMessageTime = new Date()
  let isConnectionClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial history
      try {
        const history = await prisma.webinarChatMessage.findMany({
          where: {
            webinarId: webinar.id,
            isHidden: false,
            isSimulated: false, // Don't include simulated in initial history
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
          select: {
            id: true,
            senderName: true,
            message: true,
            isFromModerator: true,
            isSimulated: true,
            createdAt: true,
          },
        })

        const historyEvent = `data: ${JSON.stringify({
          type: 'history',
          messages: history.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          })),
        })}\n\n`

        controller.enqueue(encoder.encode(historyEvent))

        if (history.length > 0) {
          lastMessageTime = history[history.length - 1].createdAt
        }
      } catch (error) {
        console.error('Failed to send chat history:', error)
      }

      // Poll for new messages every 2 seconds
      // In production, this would be replaced with Redis pub/sub
      const pollInterval = setInterval(async () => {
        if (isConnectionClosed) {
          clearInterval(pollInterval)
          return
        }

        try {
          const newMessages = await prisma.webinarChatMessage.findMany({
            where: {
              webinarId: webinar.id,
              isHidden: false,
              isSimulated: false,
              createdAt: { gt: lastMessageTime },
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
            select: {
              id: true,
              senderName: true,
              message: true,
              isFromModerator: true,
              isSimulated: true,
              createdAt: true,
            },
          })

          for (const msg of newMessages) {
            const event = `data: ${JSON.stringify({
              type: 'message',
              message: {
                ...msg,
                createdAt: msg.createdAt.toISOString(),
              },
            })}\n\n`

            controller.enqueue(encoder.encode(event))
            lastMessageTime = msg.createdAt
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          console.error('Failed to poll for new messages:', error)
        }
      }, 2000)

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        isConnectionClosed = true
        clearInterval(pollInterval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
