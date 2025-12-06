import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/chat/simulated - List all simulated messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json(
      { error: 'Failed to fetch simulated messages' },
      { status: 500 }
    )
  }
}

// POST /api/admin/webinars/[id]/chat/simulated - Create simulated message
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { senderName, message, appearsAt, isFromModerator } = body

    // Validate required fields
    if (!senderName || !message || appearsAt === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: senderName, message, appearsAt' },
        { status: 400 }
      )
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
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
    return NextResponse.json(
      { error: 'Failed to create simulated message' },
      { status: 500 }
    )
  }
}
