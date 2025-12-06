import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; messageId: string }>
}

// PATCH /api/admin/webinars/[id]/chat/simulated/[messageId] - Update simulated message
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: webinarId, messageId } = await params

  try {
    // Verify message exists and belongs to this webinar
    const existing = await prisma.webinarChatMessage.findUnique({
      where: {
        id: messageId,
        webinarId,
        isSimulated: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Simulated message not found' }, { status: 404 })
    }

    const body = await request.json()
    const { senderName, message, appearsAt, isFromModerator } = body

    const updated = await prisma.webinarChatMessage.update({
      where: { id: messageId },
      data: {
        ...(senderName && { senderName }),
        ...(message && { message }),
        ...(appearsAt !== undefined && { appearsAt }),
        ...(isFromModerator !== undefined && { isFromModerator }),
      },
    })

    return NextResponse.json({
      message: {
        id: updated.id,
        senderName: updated.senderName,
        message: updated.message,
        appearsAt: updated.appearsAt,
        isFromModerator: updated.isFromModerator,
      },
    })
  } catch (error) {
    logger.error('Failed to update simulated message:', error)
    return NextResponse.json(
      { error: 'Failed to update simulated message' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/webinars/[id]/chat/simulated/[messageId] - Delete simulated message
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: webinarId, messageId } = await params

  try {
    // Verify message exists and belongs to this webinar
    const existing = await prisma.webinarChatMessage.findUnique({
      where: {
        id: messageId,
        webinarId,
        isSimulated: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Simulated message not found' }, { status: 404 })
    }

    await prisma.webinarChatMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete simulated message:', error)
    return NextResponse.json(
      { error: 'Failed to delete simulated message' },
      { status: 500 }
    )
  }
}
