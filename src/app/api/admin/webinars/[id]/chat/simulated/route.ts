import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/chat/simulated - List all simulated messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const messages = await prisma.webinarChatMessage.findMany({
      where: {
        webinarId: id,
        isSimulated: true,
      },
      orderBy: { appearsAt: 'asc' },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderName: m.senderName,
        message: m.message,
        appearsAt: m.appearsAt,
        isFromModerator: m.isFromModerator,
      })),
    })
  } catch (error) {
    logger.error('Failed to fetch simulated messages:', error)
    return errorResponse('Failed to fetch simulated messages')
  }
}

// POST /api/admin/webinars/[id]/chat/simulated - Create simulated message
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { senderName, message, appearsAt, isFromModerator } = body

    // Validate required fields
    if (!senderName || !message || appearsAt === undefined) {
      return badRequestResponse('Missing required fields: senderName, message, appearsAt')
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    const chatMessage = await prisma.webinarChatMessage.create({
      data: {
        webinarId: id,
        senderName,
        message,
        appearsAt,
        isSimulated: true,
        isFromModerator: isFromModerator || false,
      },
    })

    return NextResponse.json({
      message: {
        id: chatMessage.id,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        appearsAt: chatMessage.appearsAt,
        isFromModerator: chatMessage.isFromModerator,
      },
    }, { status: 201 })
  } catch (error) {
    logger.error('Failed to create simulated message:', error)
    return errorResponse('Failed to create simulated message')
  }
}
