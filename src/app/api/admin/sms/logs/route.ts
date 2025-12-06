import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'
import { SmsStatus, SmsType } from '@prisma/client'

/**
 * GET /api/admin/sms/logs
 * Get SMS logs with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') as SmsStatus | null
    const type = searchParams.get('type') as SmsType | null
    const phone = searchParams.get('phone')
    const days = parseInt(searchParams.get('days') || '30')

    // Date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      createdAt: { gte: startDate },
    }

    if (status) where.status = status
    if (type) where.type = type
    if (phone) where.phone = { contains: phone }

    // Fetch logs
    const [logs, total] = await Promise.all([
      prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.smsLog.count({ where }),
    ])

    // Get stats for the period
    const stats = await prisma.smsLog.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    })

    const statusCounts = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.id
        return acc
      },
      {} as Record<string, number>
    )

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStats = await prisma.smsLog.groupBy({
      by: ['status'],
      where: { createdAt: { gte: today } },
      _count: { id: true },
    })

    const todayCounts = todayStats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.id
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        period: {
          days,
          total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
          ...statusCounts,
        },
        today: {
          total: Object.values(todayCounts).reduce((a, b) => a + b, 0),
          sent: todayCounts.SENT || 0,
          delivered: todayCounts.DELIVERED || 0,
          failed: todayCounts.FAILED || 0,
          pending: todayCounts.PENDING || 0,
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching SMS logs:', error)
    return errorResponse('Failed to fetch SMS logs')
  }
}
