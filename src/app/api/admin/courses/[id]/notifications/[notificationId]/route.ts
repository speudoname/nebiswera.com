import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse, successResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { CourseNotificationTrigger, LmsNotificationChannel } from '@prisma/client'
import { formatTriggerDescription } from '@/app/api/courses/lib/notifications'

interface RouteParams {
  params: Promise<{ id: string; notificationId: string }>
}

// GET /api/admin/courses/[id]/notifications/[notificationId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, notificationId } = await params

  try {
    const notification = await prisma.courseNotificationConfig.findFirst({
      where: {
        id: notificationId,
        courseId: id,
      },
      include: {
        _count: {
          select: {
            queue: true,
            logs: true,
          },
        },
      },
    })

    if (!notification) {
      return notFoundResponse('Notification not found')
    }

    // Get detailed stats
    const sentCount = await prisma.courseNotificationLog.count({
      where: {
        configId: notification.id,
        status: 'SENT',
      },
    })

    const pendingCount = await prisma.courseNotificationQueue.count({
      where: {
        configId: notification.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
        templateKey: notification.templateKey,
        trigger: notification.trigger,
        triggerMinutes: notification.triggerMinutes,
        triggerDescription: formatTriggerDescription(
          notification.trigger,
          notification.triggerMinutes
        ),
        conditions: notification.conditions,
        channel: notification.channel,
        subject: notification.subject,
        previewText: notification.previewText,
        bodyHtml: notification.bodyHtml,
        bodyText: notification.bodyText,
        bodyDesign: notification.bodyDesign,
        fromName: notification.fromName,
        fromEmail: notification.fromEmail,
        replyTo: notification.replyTo,
        actions: notification.actions,
        isActive: notification.isActive,
        isDefault: notification.isDefault,
        sortOrder: notification.sortOrder,
        stats: {
          sent: sentCount,
          pending: pendingCount,
          queued: notification._count.queue,
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

// PUT /api/admin/courses/[id]/notifications/[notificationId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, notificationId } = await params

  try {
    // Verify notification exists and belongs to course
    const existing = await prisma.courseNotificationConfig.findFirst({
      where: {
        id: notificationId,
        courseId: id,
      },
    })

    if (!existing) {
      return notFoundResponse('Notification not found')
    }

    const body = await request.json()
    const {
      trigger,
      triggerMinutes,
      conditions,
      channel,
      // Content
      subject,
      previewText,
      bodyHtml,
      bodyText,
      bodyDesign,
      // Sender settings
      fromName,
      fromEmail,
      replyTo,
      // Actions
      actions,
      isActive,
      sortOrder,
    } = body

    // Validate trigger type if provided
    if (trigger) {
      const validTriggerTypes: CourseNotificationTrigger[] = [
        'AFTER_ENROLLMENT',
        'ON_COURSE_START',
        'ON_LESSON_COMPLETE',
        'ON_MODULE_COMPLETE',
        'ON_COURSE_COMPLETE',
        'ON_QUIZ_PASS',
        'ON_QUIZ_FAIL',
        'ON_INACTIVITY',
        'BEFORE_EXPIRATION',
        'ON_CERTIFICATE_ISSUED',
      ]
      if (!validTriggerTypes.includes(trigger)) {
        return badRequestResponse('Invalid trigger type')
      }
    }

    // Validate channel if provided
    if (channel) {
      const validChannels: LmsNotificationChannel[] = ['EMAIL']
      if (!validChannels.includes(channel)) {
        return badRequestResponse('Invalid channel')
      }
    }

    const notification = await prisma.courseNotificationConfig.update({
      where: { id: notificationId },
      data: {
        ...(trigger && { trigger: trigger as CourseNotificationTrigger }),
        ...(triggerMinutes !== undefined && { triggerMinutes }),
        ...(conditions !== undefined && { conditions }),
        ...(channel && { channel: channel as LmsNotificationChannel }),
        // Content
        ...(subject !== undefined && { subject }),
        ...(previewText !== undefined && { previewText }),
        ...(bodyHtml !== undefined && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        ...(bodyDesign !== undefined && { bodyDesign }),
        // Sender settings
        ...(fromName !== undefined && { fromName }),
        ...(fromEmail !== undefined && { fromEmail }),
        ...(replyTo !== undefined && { replyTo }),
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
        trigger: notification.trigger,
        triggerMinutes: notification.triggerMinutes,
        triggerDescription: formatTriggerDescription(
          notification.trigger,
          notification.triggerMinutes
        ),
        conditions: notification.conditions,
        channel: notification.channel,
        subject: notification.subject,
        previewText: notification.previewText,
        bodyHtml: notification.bodyHtml,
        bodyText: notification.bodyText,
        bodyDesign: notification.bodyDesign,
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
    logger.error('Failed to update notification:', error)
    return errorResponse('Failed to update notification')
  }
}

// PATCH /api/admin/courses/[id]/notifications/[notificationId] - Toggle active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, notificationId } = await params

  try {
    const existing = await prisma.courseNotificationConfig.findFirst({
      where: {
        id: notificationId,
        courseId: id,
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

    const notification = await prisma.courseNotificationConfig.update({
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

// DELETE /api/admin/courses/[id]/notifications/[notificationId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, notificationId } = await params

  try {
    // Verify notification exists and belongs to course
    const existing = await prisma.courseNotificationConfig.findFirst({
      where: {
        id: notificationId,
        courseId: id,
      },
    })

    if (!existing) {
      return notFoundResponse('Notification not found')
    }

    // Cancel any pending queue items before deleting
    await prisma.courseNotificationQueue.updateMany({
      where: {
        configId: notificationId,
        status: 'PENDING',
      },
      data: {
        status: 'SKIPPED',
        processedAt: new Date(),
        lastError: 'Notification deleted',
      },
    })

    await prisma.courseNotificationConfig.delete({
      where: { id: notificationId },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete notification:', error)
    return errorResponse('Failed to delete notification')
  }
}
