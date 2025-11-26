import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { WebinarNotificationType, WebinarNotificationTrigger } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/notifications - List all notifications
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const notifications = await prisma.webinarNotification.findMany({
      where: { webinarId: id },
      orderBy: [{ type: 'asc' }, { trigger: 'asc' }],
    })

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        trigger: n.trigger,
        triggerMinutes: n.triggerMinutes,
        subject: n.subject,
        bodyHtml: n.bodyHtml,
        bodyText: n.bodyText,
        enabled: n.enabled,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/admin/webinars/[id]/notifications - Create a new notification
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, trigger, triggerMinutes, subject, bodyHtml, bodyText, enabled } = body

    // Validate type
    const validTypes: WebinarNotificationType[] = ['CONFIRMATION', 'REMINDER', 'FOLLOW_UP']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // Validate trigger
    const validTriggers: WebinarNotificationTrigger[] = [
      'REGISTERED_SCHEDULED',
      'REGISTERED_REPLAY',
      'REGISTERED_ON_DEMAND',
      'REMINDER_BEFORE',
      'FOLLOW_UP_ATTENDED',
      'FOLLOW_UP_COMPLETED',
      'FOLLOW_UP_MISSED',
      'FOLLOW_UP_LEFT_EARLY',
    ]
    if (!validTriggers.includes(trigger)) {
      return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 })
    }

    // Check if notification with this trigger already exists
    const existing = await prisma.webinarNotification.findFirst({
      where: { webinarId: id, trigger },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A notification with this trigger already exists' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!subject || !bodyHtml) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.webinarNotification.create({
      data: {
        webinarId: id,
        type: type as WebinarNotificationType,
        trigger: trigger as WebinarNotificationTrigger,
        triggerMinutes: triggerMinutes || null,
        subject,
        bodyHtml,
        bodyText: bodyText || null,
        enabled: enabled !== false,
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
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
