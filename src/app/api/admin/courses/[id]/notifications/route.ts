import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { CourseNotificationTrigger, LmsNotificationChannel } from '@prisma/client'
import {
  createDefaultNotifications,
  formatTriggerDescription,
} from '@/app/api/courses/lib/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/notifications - List all notifications with stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse('Unauthorized')
  }

  const { id } = await params

  try {
    const notifications = await prisma.courseNotificationConfig.findMany({
      where: { courseId: id },
      orderBy: [
        { trigger: 'asc' },
        { triggerMinutes: 'asc' },
        { sortOrder: 'asc' },
      ],
      include: {
        _count: {
          select: {
            queue: true,
            logs: true,
          },
        },
      },
    })

    // Get sent/pending counts per notification
    const notificationsWithStats = await Promise.all(
      notifications.map(async (n) => {
        const sentCount = await prisma.courseNotificationLog.count({
          where: {
            configId: n.id,
            status: 'SENT',
          },
        })

        const pendingCount = await prisma.courseNotificationQueue.count({
          where: {
            configId: n.id,
            status: 'PENDING',
          },
        })

        return {
          id: n.id,
          templateKey: n.templateKey,
          trigger: n.trigger,
          triggerMinutes: n.triggerMinutes,
          triggerDescription: formatTriggerDescription(n.trigger, n.triggerMinutes),
          conditions: n.conditions,
          channel: n.channel,
          // Content
          subject: n.subject,
          previewText: n.previewText,
          bodyHtml: n.bodyHtml,
          bodyText: n.bodyText,
          bodyDesign: n.bodyDesign,
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
            queued: n._count.queue,
            logged: n._count.logs,
          },
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }
      })
    )

    return successResponse({ notifications: notificationsWithStats })
  } catch (error) {
    logger.error('Failed to fetch notifications:', error)
    return errorResponse(error)
  }
}

// POST /api/admin/courses/[id]/notifications - Create a new notification
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse('Unauthorized')
  }

  const { id } = await params

  try {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    const body = await request.json()

    // Handle special action: create defaults
    if (body.action === 'createDefaults') {
      // Check if defaults already exist
      const existingDefaults = await prisma.courseNotificationConfig.count({
        where: { courseId: id, isDefault: true },
      })

      if (existingDefaults > 0) {
        return badRequestResponse('Default notifications already exist')
      }

      await createDefaultNotifications(id)

      const notifications = await prisma.courseNotificationConfig.findMany({
        where: { courseId: id },
        orderBy: [{ trigger: 'asc' }, { triggerMinutes: 'asc' }],
      })

      return successResponse({
        message: 'Default notifications created',
        notifications: notifications.map((n) => ({
          id: n.id,
          templateKey: n.templateKey,
          trigger: n.trigger,
          triggerMinutes: n.triggerMinutes,
          triggerDescription: formatTriggerDescription(n.trigger, n.triggerMinutes),
          channel: n.channel,
          subject: n.subject,
          isActive: n.isActive,
          isDefault: n.isDefault,
        })),
      })
    }

    // Regular notification creation
    const {
      templateKey,
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

    // Validate channel
    const validChannels: LmsNotificationChannel[] = ['EMAIL']
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
      const maxSortOrder = await prisma.courseNotificationConfig.aggregate({
        where: { courseId: id },
        _max: { sortOrder: true },
      })
      finalSortOrder = (maxSortOrder._max.sortOrder || 0) + 1
    }

    const notification = await prisma.courseNotificationConfig.create({
      data: {
        courseId: id,
        templateKey: templateKey || null,
        trigger: trigger as CourseNotificationTrigger,
        triggerMinutes: triggerMinutes ?? 0,
        conditions: conditions || null,
        channel: (channel as LmsNotificationChannel) || 'EMAIL',
        // Content
        subject: subject || null,
        previewText: previewText || null,
        bodyHtml: bodyHtml || null,
        bodyText: bodyText || null,
        bodyDesign: bodyDesign || null,
        // Sender settings
        fromName: fromName || null,
        fromEmail: fromEmail || null,
        replyTo: replyTo || null,
        // Actions
        actions: actions || null,
        isActive: isActive !== false,
        isDefault: templateKey ? true : false,
        sortOrder: finalSortOrder,
      },
    })

    return successResponse({
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
    logger.error('Failed to create notification:', error)
    return errorResponse(error)
  }
}
