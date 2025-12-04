import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse } from '@/lib'
import type { NextRequest } from 'next/server'
import { NotificationQueueStatus, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all'
  const webinarId = searchParams.get('webinarId') || 'all'
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where: Prisma.WebinarNotificationQueueWhereInput = {}

  if (status !== 'all' && Object.values(NotificationQueueStatus).includes(status as NotificationQueueStatus)) {
    where.status = status as NotificationQueueStatus
  }

  if (webinarId !== 'all') {
    where.notification = { webinarId }
  }

  if (search) {
    where.registration = {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [items, total, webinars] = await Promise.all([
    prisma.webinarNotificationQueue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: 'desc' },
      include: {
        notification: {
          select: {
            id: true,
            triggerType: true,
            triggerMinutes: true,
            templateKey: true,
            subject: true,
            webinar: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        registration: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.webinarNotificationQueue.count({ where }),
    // Get list of webinars for filter dropdown
    prisma.webinar.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Get summary counts
  const counts = await prisma.webinarNotificationQueue.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  const summary = {
    pending: counts.find((c) => c.status === 'PENDING')?._count.status || 0,
    processing: counts.find((c) => c.status === 'PROCESSING')?._count.status || 0,
    sent: counts.find((c) => c.status === 'SENT')?._count.status || 0,
    skipped: counts.find((c) => c.status === 'SKIPPED')?._count.status || 0,
    failed: counts.find((c) => c.status === 'FAILED')?._count.status || 0,
  }

  return successResponse({
    items: items.map((item) => ({
      id: item.id,
      status: item.status,
      scheduledAt: item.scheduledAt,
      processedAt: item.processedAt,
      attempts: item.attempts,
      lastError: item.lastError,
      createdAt: item.createdAt,
      notification: item.notification
        ? {
            id: item.notification.id,
            triggerType: item.notification.triggerType,
            triggerMinutes: item.notification.triggerMinutes,
            templateKey: item.notification.templateKey,
            subject: item.notification.subject,
            webinar: item.notification.webinar,
          }
        : null,
      registration: item.registration,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary,
    webinars,
  })
}
