import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse, successResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { NotificationTriggerType, NotificationChannel } from '@prisma/client'
import { formatTriggerDescription } from '@/app/api/webinars/lib/notifications'

interface RouteParams {
  params: Promise<{ id: string; notificationId: string }>
}

// GET /api/admin/webinars/[id]/notifications/[notificationId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, notificationId } = await params

  try {
    const notification = await prisma.webinarNotification.findFirst({
      where: {
        id: notificationId,
        webinarId: id,
      },
      include: {
        _count: {
          select: {
            queueItems: true,
            logs: true,
          },
        },
      },
    })

    if (!notification) {
      return notFoundResponse('Notification not found')
    }

    // Get detailed stats
    const sentCount = await prisma.webinarNotificationLog.count({
      where: {
        notificationId: notification.id,
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
      },
    })

    const pendingCount = await prisma.webinarNotificationQueue.count({
      where: {
        notificationId: notification.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
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
        isActive: notification.isActive,
        isDefault: notification.isDefault,
        sortOrder: notification.sortOrder,
        stats: {
          sent: sentCount,
          pending: pendingCount,
          queued: notification._count.queueItems,
          logged: notification._count.logs,
        },
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch notification:', error)
    return errorResponse('Failed to fetch notification')
  }
}

// PUT /api/admin/webinars/[id]/notifications/[notificationId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
      return notFoundResponse('Notification not found')
    }

    const body = await request.json()
    const {
      triggerType,
      triggerMinutes,
      conditions,
      channel,
      // Custom content (only for non-template notifications)
      subject,
      bodyHtml,
      bodyText,
      // Actions
      actions,
      isActive,
      sortOrder,
    } = body

    // Validate trigger type if provided
    if (triggerType) {
      const validTriggerTypes: NotificationTriggerType[] = [
        'AFTER_REGISTRATION',
        'BEFORE_START',
        'AFTER_END',
      ]
      if (!validTriggerTypes.includes(triggerType)) {
        return badRequestResponse('Invalid trigger type')
      }
    }

    // Validate channel if provided
    if (channel) {
      const validChannels: NotificationChannel[] = ['EMAIL', 'SMS']
      if (!validChannels.includes(channel)) {
        return badRequestResponse('Invalid channel')
      }
    }

    const notification = await prisma.webinarNotification.update({
      where: { id: notificationId },
      data: {
        ...(triggerType && { triggerType: triggerType as NotificationTriggerType }),
        ...(triggerMinutes !== undefined && { triggerMinutes }),
        ...(conditions !== undefined && { conditions }),
        ...(channel && { channel: channel as NotificationChannel }),
        // Custom content
        ...(subject !== undefined && { subject }),
        ...(bodyHtml !== undefined && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        // Actions
        ...(actions !== undefined && { actions }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
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
        actions: notification.actions,
        isActive: notification.isActive,
        isDefault: notification.isDefault,
        sortOrder: notification.sortOrder,
      },
    })
  } catch (error) {
    logger.error('Failed to update notification:', error)
    return errorResponse('Failed to update notification')
  }
}

// PATCH /api/admin/webinars/[id]/notifications/[notificationId] - Toggle active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, notificationId } = await params

  try {
    const existing = await prisma.webinarNotification.findFirst({
      where: {
        id: notificationId,
        webinarId: id,
      },
    })

    if (!existing) {
      return notFoundResponse('Notification not found')
    }

    const body = await request.json()

    // Only allow toggling isActive via PATCH
    if (typeof body.isActive !== 'boolean') {
      return badRequestResponse('isActive boolean required')
    }

    const notification = await prisma.webinarNotification.update({
      where: { id: notificationId },
      data: { isActive: body.isActive },
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
        isActive: notification.isActive,
      },
    })
  } catch (error) {
    logger.error('Failed to toggle notification:', error)
    return errorResponse('Failed to toggle notification')
  }
}

// DELETE /api/admin/webinars/[id]/notifications/[notificationId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
      return notFoundResponse('Notification not found')
    }

    // Cancel any pending queue items before deleting
    await prisma.webinarNotificationQueue.updateMany({
      where: {
        notificationId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        processedAt: new Date(),
      },
    })

    await prisma.webinarNotification.delete({
      where: { id: notificationId },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete notification:', error)
    return errorResponse('Failed to delete notification')
  }
}
