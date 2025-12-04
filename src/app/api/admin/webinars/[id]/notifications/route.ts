import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { NotificationTriggerType, NotificationChannel } from '@prisma/client'
import {
  createDefaultNotifications,
  formatTriggerDescription,
} from '@/app/api/webinars/lib/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/notifications - List all notifications with stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const notifications = await prisma.webinarNotification.findMany({
      where: { webinarId: id },
      orderBy: [
        { triggerType: 'asc' },
        { triggerMinutes: 'asc' },
        { sortOrder: 'asc' },
      ],
      include: {
        _count: {
          select: {
            queueItems: true,
            logs: true,
          },
        },
      },
    })

    // Get sent/pending counts per notification
    const notificationsWithStats = await Promise.all(
      notifications.map(async (n) => {
        const sentCount = await prisma.webinarNotificationLog.count({
          where: {
            notificationId: n.id,
            status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
          },
        })

        const pendingCount = await prisma.webinarNotificationQueue.count({
          where: {
            notificationId: n.id,
            status: 'PENDING',
          },
        })

        return {
          id: n.id,
          templateKey: n.templateKey,
          triggerType: n.triggerType,
          triggerMinutes: n.triggerMinutes,
          triggerDescription: formatTriggerDescription(n.triggerType, n.triggerMinutes),
          conditions: n.conditions,
          channel: n.channel,
          // Content
          subject: n.subject,
          bodyHtml: n.bodyHtml,
          bodyText: n.bodyText,
          // Sender settings
          fromName: n.fromName,
          fromEmail: n.fromEmail,
          replyTo: n.replyTo,
          // Actions
          actions: n.actions,
          isActive: n.isActive,
          isDefault: n.isDefault,
          sortOrder: n.sortOrder,
          stats: {
            sent: sentCount,
            pending: pendingCount,
            queued: n._count.queueItems,
            logged: n._count.logs,
          },
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }
      })
    )

    return NextResponse.json({ notifications: notificationsWithStats })
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

    // Handle special action: create defaults
    if (body.action === 'createDefaults') {
      // Check if defaults already exist
      const existingDefaults = await prisma.webinarNotification.count({
        where: { webinarId: id, isDefault: true },
      })

      if (existingDefaults > 0) {
        return NextResponse.json(
          { error: 'Default notifications already exist' },
          { status: 400 }
        )
      }

      await createDefaultNotifications(id)

      const notifications = await prisma.webinarNotification.findMany({
        where: { webinarId: id },
        orderBy: [{ triggerType: 'asc' }, { triggerMinutes: 'asc' }],
      })

      return NextResponse.json({
        message: 'Default notifications created',
        notifications: notifications.map((n) => ({
          id: n.id,
          triggerType: n.triggerType,
          triggerMinutes: n.triggerMinutes,
          triggerDescription: formatTriggerDescription(n.triggerType, n.triggerMinutes),
          channel: n.channel,
          subject: n.subject,
          isActive: n.isActive,
          isDefault: n.isDefault,
        })),
      })
    }

    // Regular notification creation
    const {
      templateKey,  // If provided, tracks which template it came from
      triggerType,
      triggerMinutes,
      conditions,
      channel,
      // Content
      subject,
      bodyHtml,
      bodyText,
      // Sender settings (optional overrides)
      fromName,
      fromEmail,
      replyTo,
      // Actions
      actions,
      isActive,
      sortOrder,
    } = body

    // Validate trigger type
    const validTriggerTypes: NotificationTriggerType[] = [
      'AFTER_REGISTRATION',
      'BEFORE_START',
      'AFTER_END',
    ]
    if (!validTriggerTypes.includes(triggerType)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 })
    }

    // Validate channel
    const validChannels: NotificationChannel[] = ['EMAIL', 'SMS']
    if (channel && !validChannels.includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    // Validate required fields for custom EMAIL notifications (not template-based)
    if (!templateKey && channel === 'EMAIL' && (!subject || !bodyHtml)) {
      return NextResponse.json(
        { error: 'Subject and body are required for custom email notifications' },
        { status: 400 }
      )
    }

    // Calculate sort order if not provided
    let finalSortOrder = sortOrder
    if (finalSortOrder === undefined) {
      const maxSortOrder = await prisma.webinarNotification.aggregate({
        where: { webinarId: id },
        _max: { sortOrder: true },
      })
      finalSortOrder = (maxSortOrder._max.sortOrder || 0) + 1
    }

    const notification = await prisma.webinarNotification.create({
      data: {
        webinarId: id,
        templateKey: templateKey || null,  // Tracks which template it came from
        triggerType: triggerType as NotificationTriggerType,
        triggerMinutes: triggerMinutes ?? 0,
        conditions: conditions || null,
        channel: (channel as NotificationChannel) || 'EMAIL',
        // Content
        subject: subject || null,
        bodyHtml: bodyHtml || null,
        bodyText: bodyText || null,
        // Sender settings (optional overrides - null means use defaults from Settings)
        fromName: fromName || null,
        fromEmail: fromEmail || null,
        replyTo: replyTo || null,
        // Actions
        actions: actions || null,
        isActive: isActive !== false,
        isDefault: templateKey ? true : false,  // Template-based notifications are marked as default
        sortOrder: finalSortOrder,
      },
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
        templateKey: notification.templateKey,
        triggerType: notification.triggerType,
        triggerMinutes: notification.triggerMinutes,
        triggerDescription: formatTriggerDescription(
          notification.triggerType,
          notification.triggerMinutes
        ),
        conditions: notification.conditions,
        channel: notification.channel,
        subject: notification.subject,
        bodyHtml: notification.bodyHtml,
        bodyText: notification.bodyText,
        fromName: notification.fromName,
        fromEmail: notification.fromEmail,
        replyTo: notification.replyTo,
        actions: notification.actions,
        isActive: notification.isActive,
        isDefault: notification.isDefault,
        sortOrder: notification.sortOrder,
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
