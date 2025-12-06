import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
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
    return unauthorizedResponse('Unauthorized')
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

    // Batch fetch sent/pending counts for all notifications (avoids N+1 queries)
    const notificationIds = notifications.map((n) => n.id)

    // Get sent counts grouped by notificationId
    const sentCounts = await prisma.webinarNotificationLog.groupBy({
      by: ['notificationId'],
      where: {
        notificationId: { in: notificationIds },
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
      },
      _count: { id: true },
    })

    // Get pending counts grouped by notificationId
    const pendingCounts = await prisma.webinarNotificationQueue.groupBy({
      by: ['notificationId'],
      where: {
        notificationId: { in: notificationIds },
        status: 'PENDING',
      },
      _count: { id: true },
    })

    // Create lookup maps for O(1) access
    const sentCountMap = new Map(sentCounts.map((s) => [s.notificationId, s._count.id]))
    const pendingCountMap = new Map(pendingCounts.map((p) => [p.notificationId, p._count.id]))

    // Map notifications with stats (no additional queries)
    const notificationsWithStats = notifications.map((n) => ({
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
        sent: sentCountMap.get(n.id) || 0,
        pending: pendingCountMap.get(n.id) || 0,
        queued: n._count.queueItems,
        logged: n._count.logs,
      },
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }))

    return successResponse({ notifications: notificationsWithStats })
  } catch (error) {
    logger.error('Failed to fetch notifications:', error)
    return errorResponse('Failed to fetch notifications')
  }
}

// POST /api/admin/webinars/[id]/notifications - Create a new notification
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse('Unauthorized')
  }

  const { id } = await params

  try {
    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    const body = await request.json()

    // Handle special action: create defaults
    if (body.action === 'createDefaults') {
      // Check if defaults already exist
      const existingDefaults = await prisma.webinarNotification.count({
        where: { webinarId: id, isDefault: true },
      })

      if (existingDefaults > 0) {
        return badRequestResponse('Default notifications already exist')
      }

      await createDefaultNotifications(id)

      const notifications = await prisma.webinarNotification.findMany({
        where: { webinarId: id },
        orderBy: [{ triggerType: 'asc' }, { triggerMinutes: 'asc' }],
      })

      return successResponse({
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
      return badRequestResponse('Invalid trigger type')
    }

    // Validate channel
    const validChannels: NotificationChannel[] = ['EMAIL', 'SMS']
    if (channel && !validChannels.includes(channel)) {
      return badRequestResponse('Invalid channel')
    }

    // Validate required fields for custom EMAIL notifications (not template-based)
    if (!templateKey && channel === 'EMAIL' && (!subject || !bodyHtml)) {
      return badRequestResponse('Subject and body are required for custom email notifications')
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

    return successResponse({
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
    logger.error('Failed to create notification:', error)
    return errorResponse(error)
  }
}
