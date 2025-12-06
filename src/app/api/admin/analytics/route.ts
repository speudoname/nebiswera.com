import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

/**
 * GET /api/admin/analytics
 * Get analytics overview data
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const pageType = searchParams.get('pageType') // Filter by page type
    const path = searchParams.get('path') // Filter by specific path

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Build where clause
    const where: Record<string, unknown> = {
      enteredAt: { gte: startDate },
    }
    if (pageType) where.pageType = pageType
    if (path) where.path = path

    // Get aggregate stats
    const [
      totalPageViews,
      uniqueVisitors,
      uniqueSessions,
      avgDuration,
      avgScrollDepth,
      engagedViews,
      bouncedViews,
    ] = await Promise.all([
      // Total page views
      prisma.pageView.count({ where }),

      // Unique visitors (by visitorId)
      prisma.pageView.groupBy({
        by: ['visitorId'],
        where: { ...where, visitorId: { not: null } },
      }).then((r) => r.length),

      // Unique sessions
      prisma.pageView.groupBy({
        by: ['sessionId'],
        where,
      }).then((r) => r.length),

      // Average duration
      prisma.pageView.aggregate({
        where,
        _avg: { duration: true },
      }),

      // Average scroll depth
      prisma.pageView.aggregate({
        where,
        _avg: { scrollDepth: true },
      }),

      // Engaged views
      prisma.pageView.count({
        where: { ...where, engaged: true },
      }),

      // Bounced views
      prisma.pageView.count({
        where: { ...where, bounced: true },
      }),
    ])

    // Top pages
    const topPages = await prisma.pageView.groupBy({
      by: ['path'],
      where,
      _count: { id: true },
      _avg: { duration: true, scrollDepth: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    // Page views by day - use groupBy instead of raw query for compatibility
    const viewsByDayRaw = await prisma.pageView.groupBy({
      by: ['enteredAt'],
      where,
      _count: { id: true },
      orderBy: { enteredAt: 'asc' },
    })

    // Aggregate by date (strip time portion)
    const viewsByDayMap = new Map<string, number>()
    for (const row of viewsByDayRaw) {
      if (row.enteredAt) {
        const dateKey = row.enteredAt.toISOString().split('T')[0]
        viewsByDayMap.set(dateKey, (viewsByDayMap.get(dateKey) || 0) + row._count.id)
      }
    }
    const viewsByDay = Array.from(viewsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top referrers
    const topReferrers = await prisma.pageView.groupBy({
      by: ['referrerDomain'],
      where: { ...where, referrerDomain: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    // Device breakdown
    const deviceBreakdown = await prisma.pageView.groupBy({
      by: ['deviceType'],
      where,
      _count: { id: true },
    })

    // Browser breakdown
    const browserBreakdown = await prisma.pageView.groupBy({
      by: ['browser'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    // Page type breakdown
    const pageTypeBreakdown = await prisma.pageView.groupBy({
      by: ['pageType'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    // UTM campaign breakdown
    const utmCampaigns = await prisma.pageView.groupBy({
      by: ['utmCampaign'],
      where: { ...where, utmCampaign: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    // OS breakdown
    const osBreakdown = await prisma.pageView.groupBy({
      by: ['os'],
      where: { ...where, os: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    // Locale breakdown
    const localeBreakdown = await prisma.pageView.groupBy({
      by: ['locale'],
      where: { ...where, locale: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    return NextResponse.json({
      overview: {
        totalPageViews,
        uniqueVisitors,
        uniqueSessions,
        avgDuration: Math.round(avgDuration._avg.duration || 0),
        avgScrollDepth: Math.round(avgScrollDepth._avg.scrollDepth || 0),
        engagementRate: totalPageViews > 0
          ? Math.round((engagedViews / totalPageViews) * 100)
          : 0,
        bounceRate: totalPageViews > 0
          ? Math.round((bouncedViews / totalPageViews) * 100)
          : 0,
      },
      topPages: topPages.map((p) => ({
        path: p.path,
        views: p._count.id,
        avgDuration: Math.round(p._avg.duration || 0),
        avgScrollDepth: Math.round(p._avg.scrollDepth || 0),
      })),
      viewsByDay,
      topReferrers: topReferrers.map((r) => ({
        domain: r.referrerDomain,
        count: r._count.id,
      })),
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.deviceType,
        count: d._count.id,
        percentage: totalPageViews > 0
          ? Math.round((d._count.id / totalPageViews) * 100)
          : 0,
      })),
      browserBreakdown: browserBreakdown.map((b) => ({
        browser: b.browser,
        count: b._count.id,
      })),
      pageTypeBreakdown: pageTypeBreakdown.map((p) => ({
        type: p.pageType,
        count: p._count.id,
      })),
      utmCampaigns: utmCampaigns.map((u) => ({
        campaign: u.utmCampaign,
        count: u._count.id,
      })),
      osBreakdown: osBreakdown.map((o) => ({
        os: o.os,
        count: o._count.id,
        percentage: totalPageViews > 0
          ? Math.round((o._count.id / totalPageViews) * 100)
          : 0,
      })),
      localeBreakdown: localeBreakdown.map((l) => ({
        locale: l.locale,
        count: l._count.id,
        percentage: totalPageViews > 0
          ? Math.round((l._count.id / totalPageViews) * 100)
          : 0,
      })),
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    })
  } catch (error) {
    logger.error('Error fetching analytics:', error)
    return errorResponse('Failed to fetch analytics')
  }
}
