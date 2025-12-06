import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

/**
 * GET /api/admin/analytics/blog/[postId]
 * Get detailed analytics for a specific blog post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { postId } = await params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get the blog post
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        titleKa: true,
        titleEn: true,
        slugKa: true,
        slugEn: true,
        viewCount: true,
        publishedAt: true,
        status: true,
        readingTimeMinutes: true,
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get all page views for this post (both language versions)
    const pageViews = await prisma.pageView.findMany({
      where: {
        pageType: 'BLOG_POST',
        enteredAt: { gte: startDate },
        OR: [
          { path: { contains: post.slugKa } },
          { path: { contains: post.slugEn } },
        ],
      },
      select: {
        id: true,
        path: true,
        locale: true,
        duration: true,
        scrollDepth: true,
        engaged: true,
        bounced: true,
        referrer: true,
        referrerDomain: true,
        deviceType: true,
        browser: true,
        os: true,
        enteredAt: true,
        exitedAt: true,
        sessionId: true,
      },
      orderBy: { enteredAt: 'desc' },
    })

    // Get all page view IDs to query events
    const pageViewIds = pageViews.map((pv) => pv.id)

    // Get all events (clicks, shares, etc.) for these page views
    const events = await prisma.pageEvent.findMany({
      where: {
        pageViewId: { in: pageViewIds },
      },
      select: {
        id: true,
        pageViewId: true,
        eventType: true,
        elementId: true,
        elementText: true,
        targetUrl: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get "next page" data - what pages did users visit after this blog post
    // We look for page views with the same sessionId that happened after
    const sessionIds = Array.from(new Set(pageViews.map((pv) => pv.sessionId).filter(Boolean)))

    const nextPageViews = await prisma.pageView.findMany({
      where: {
        sessionId: { in: sessionIds as string[] },
        pageType: { not: 'BLOG_POST' },
        enteredAt: { gte: startDate },
        path: { not: { contains: post.slugKa } },
      },
      select: {
        sessionId: true,
        path: true,
        pageType: true,
        enteredAt: true,
      },
      orderBy: { enteredAt: 'asc' },
    })

    // Find the next page for each session
    const nextPages = new Map<string, { path: string; pageType: string }>()
    for (const pv of pageViews) {
      if (!pv.sessionId) continue

      // Find the first page view after this one in the same session
      const nextPv = nextPageViews.find(
        (npv) =>
          npv.sessionId === pv.sessionId &&
          npv.enteredAt > pv.enteredAt
      )

      if (nextPv && !nextPages.has(pv.sessionId)) {
        nextPages.set(pv.sessionId, { path: nextPv.path, pageType: nextPv.pageType })
      }
    }

    // Aggregate referrer data
    const referrerStats = new Map<string, number>()
    for (const pv of pageViews) {
      const domain = pv.referrerDomain || 'Direct'
      referrerStats.set(domain, (referrerStats.get(domain) || 0) + 1)
    }

    // Aggregate link click data
    const linkClickStats = new Map<string, { count: number; text: string; type: string }>()
    for (const event of events) {
      if (event.eventType === 'LINK_CLICK' && event.targetUrl) {
        const existing = linkClickStats.get(event.targetUrl)
        if (existing) {
          existing.count++
        } else {
          const metadata = event.metadata as Record<string, unknown> | null
          linkClickStats.set(event.targetUrl, {
            count: 1,
            text: event.elementText || '',
            type: (metadata?.linkType as string) || 'unknown',
          })
        }
      }
    }

    // Aggregate next page data
    const nextPageStats = new Map<string, number>()
    nextPages.forEach((data) => {
      nextPageStats.set(data.path, (nextPageStats.get(data.path) || 0) + 1)
    })

    // Calculate time distribution
    const durationBuckets = { '0-30s': 0, '30s-1m': 0, '1-3m': 0, '3-5m': 0, '5m+': 0 }
    for (const pv of pageViews) {
      const d = pv.duration || 0
      if (d < 30) durationBuckets['0-30s']++
      else if (d < 60) durationBuckets['30s-1m']++
      else if (d < 180) durationBuckets['1-3m']++
      else if (d < 300) durationBuckets['3-5m']++
      else durationBuckets['5m+']++
    }

    // Calculate scroll depth distribution
    const scrollBuckets = { '0-25%': 0, '25-50%': 0, '50-75%': 0, '75-100%': 0 }
    for (const pv of pageViews) {
      const s = pv.scrollDepth || 0
      if (s < 25) scrollBuckets['0-25%']++
      else if (s < 50) scrollBuckets['25-50%']++
      else if (s < 75) scrollBuckets['50-75%']++
      else scrollBuckets['75-100%']++
    }

    // Calculate daily views
    const dailyViews = new Map<string, number>()
    for (const pv of pageViews) {
      const dateKey = pv.enteredAt.toISOString().split('T')[0]
      dailyViews.set(dateKey, (dailyViews.get(dateKey) || 0) + 1)
    }

    // Device breakdown
    const deviceStats = { DESKTOP: 0, MOBILE: 0, TABLET: 0 }
    for (const pv of pageViews) {
      if (pv.deviceType in deviceStats) {
        deviceStats[pv.deviceType as keyof typeof deviceStats]++
      }
    }

    // Engagement metrics
    const totalViews = pageViews.length
    const engagedViews = pageViews.filter((pv) => pv.engaged).length
    const bouncedViews = pageViews.filter((pv) => pv.bounced).length
    const avgDuration = totalViews > 0
      ? Math.round(pageViews.reduce((sum, pv) => sum + (pv.duration || 0), 0) / totalViews)
      : 0
    const avgScrollDepth = totalViews > 0
      ? Math.round(pageViews.reduce((sum, pv) => sum + (pv.scrollDepth || 0), 0) / totalViews)
      : 0

    // Event counts
    const eventCounts = {
      linkClicks: events.filter((e) => e.eventType === 'LINK_CLICK').length,
      shares: events.filter((e) => e.eventType === 'SHARE').length,
      buttonClicks: events.filter((e) => e.eventType === 'BUTTON_CLICK').length,
    }

    return NextResponse.json({
      post: {
        id: post.id,
        titleKa: post.titleKa,
        titleEn: post.titleEn,
        slugKa: post.slugKa,
        slugEn: post.slugEn,
        status: post.status,
        publishedAt: post.publishedAt,
        readingTimeMinutes: post.readingTimeMinutes,
        allTimeViews: post.viewCount,
      },
      overview: {
        periodViews: totalViews,
        uniqueSessions: sessionIds.length,
        avgDuration,
        avgScrollDepth,
        engagementRate: totalViews > 0 ? Math.round((engagedViews / totalViews) * 100) : 0,
        bounceRate: totalViews > 0 ? Math.round((bouncedViews / totalViews) * 100) : 0,
        ...eventCounts,
      },
      referrers: Array.from(referrerStats.entries())
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      linkClicks: Array.from(linkClickStats.entries())
        .map(([url, data]) => ({ url, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      nextPages: Array.from(nextPageStats.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      durationDistribution: durationBuckets,
      scrollDistribution: scrollBuckets,
      deviceBreakdown: deviceStats,
      dailyViews: Array.from(dailyViews.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentViews: pageViews.slice(0, 50).map((pv) => ({
        path: pv.path,
        locale: pv.locale,
        duration: pv.duration,
        scrollDepth: pv.scrollDepth,
        engaged: pv.engaged,
        bounced: pv.bounced,
        referrerDomain: pv.referrerDomain,
        deviceType: pv.deviceType,
        browser: pv.browser,
        os: pv.os,
        enteredAt: pv.enteredAt,
      })),
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    })
  } catch (error) {
    logger.error('Error fetching blog post analytics:', error)
    return errorResponse('Failed to fetch blog post analytics')
  }
}
