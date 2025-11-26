import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; notificationId: string }>
}

// GET /api/admin/webinars/[id]/notifications/[notificationId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, notificationId } = await params

  try {
    const notification = await prisma.webinarNotification.findFirst({
      where: {
        id: notificationId,
        webinarId: id,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({
      notification: {
        id: notification.id,
        type: notification.type,
        trigger: notification.trigger,
        triggerMinutes: notification.triggerMinutes,
        subject: notification.subject,
        bodyHtml: notification.bodyHtml,
        bodyText: notification.bodyText,
        enabled: notification.enabled,
      },
    })
  } catch (error) {
    console.error('Failed to fetch notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webinars/[id]/notifications/[notificationId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, notificationId } = await params

  try {
    // Verify notification exists and belongs to webinar
    const existing = await prisma.webinarNotification.findFirst({
      where: {
        id: notificationId,
        webinarId: id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const body = await request.json()
    const { triggerMinutes, subject, bodyHtml, bodyText, enabled } = body

    const notification = await prisma.webinarNotification.update({
      where: { id: notificationId },
      data: {
        ...(triggerMinutes !== undefined && { triggerMinutes }),
        ...(subject && { subject }),
        ...(bodyHtml && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        ...(typeof enabled === 'boolean' && { enabled }),
      },
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
        type: notification.type,
        trigger: notification.trigger,
        triggerMinutes: notification.triggerMinutes,
        subject: notification.subject,
        bodyHtml: notification.bodyHtml,
        bodyText: notification.bodyText,
        enabled: notification.enabled,
      },
    })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/webinars/[id]/notifications/[notificationId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, notificationId } = await params

  try {
    // Verify notification exists and belongs to webinar
    const existing = await prisma.webinarNotification.findFirst({
      where: {
        id: notificationId,
        webinarId: id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await prisma.webinarNotification.delete({
      where: { id: notificationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
