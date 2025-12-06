import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

/**
 * GET /api/admin/analytics/blog
 * Get analytics for blog posts
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const postId = searchParams.get('postId') // Specific post

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get all blog posts with their view counts from database
    const blogPosts = await prisma.blogPost.findMany({
      where: postId ? { id: postId } : undefined,
      select: {
        id: true,
        titleKa: true,
        titleEn: true,
        slugKa: true,
        slugEn: true,
        viewCount: true,
        publishedAt: true,
        status: true,
      },
      orderBy: { viewCount: 'desc' },
    })

    // Get page view analytics for blog posts
    const blogPageViews = await prisma.pageView.findMany({
      where: {
        pageType: 'BLOG_POST',
        enteredAt: { gte: startDate },
        ...(postId ? { pageId: postId } : {}),
      },
      select: {
        path: true,
        pageId: true,
        duration: true,
        scrollDepth: true,
        engaged: true,
        bounced: true,
        referrerDomain: true,
        deviceType: true,
        enteredAt: true,
      },
    })

    // Aggregate by post
    const postAnalytics = new Map<string, {
      views: number
      totalDuration: number
      totalScrollDepth: number
      engaged: number
      bounced: number
      referrers: Map<string, number>
      devices: { desktop: number; mobile: number; tablet: number }
    }>()

    for (const pv of blogPageViews) {
      // Extract slug from path (e.g., /blog/my-post -> my-post)
      const slug = pv.path.replace('/blog/', '')

      if (!postAnalytics.has(slug)) {
        postAnalytics.set(slug, {
          views: 0,
          totalDuration: 0,
          totalScrollDepth: 0,
          engaged: 0,
          bounced: 0,
          referrers: new Map(),
          devices: { desktop: 0, mobile: 0, tablet: 0 },
        })
      }

      const stats = postAnalytics.get(slug)!
      stats.views++
      stats.totalDuration += pv.duration || 0
      stats.totalScrollDepth += pv.scrollDepth || 0
      if (pv.engaged) stats.engaged++
      if (pv.bounced) stats.bounced++

      if (pv.referrerDomain) {
        stats.referrers.set(
          pv.referrerDomain,
          (stats.referrers.get(pv.referrerDomain) || 0) + 1
        )
      }

      const deviceKey = pv.deviceType.toLowerCase() as 'desktop' | 'mobile' | 'tablet'
      stats.devices[deviceKey]++
    }

    // Build response with blog post info
    const postsWithAnalytics = blogPosts.map((post) => {
      // Check both slugs
      const statsKa = postAnalytics.get(post.slugKa)
      const statsEn = postAnalytics.get(post.slugEn)

      // Combine stats from both language versions
      const combinedViews = (statsKa?.views || 0) + (statsEn?.views || 0)
      const combinedDuration = (statsKa?.totalDuration || 0) + (statsEn?.totalDuration || 0)
      const combinedScrollDepth = (statsKa?.totalScrollDepth || 0) + (statsEn?.totalScrollDepth || 0)
      const combinedEngaged = (statsKa?.engaged || 0) + (statsEn?.engaged || 0)
      const combinedBounced = (statsKa?.bounced || 0) + (statsEn?.bounced || 0)

      return {
        id: post.id,
        titleKa: post.titleKa,
        titleEn: post.titleEn,
        slugKa: post.slugKa,
        slugEn: post.slugEn,
        status: post.status,
        publishedAt: post.publishedAt,
        totalViewCount: post.viewCount, // All-time from DB
        periodViews: combinedViews, // Views in selected period
        avgDuration: combinedViews > 0 ? Math.round(combinedDuration / combinedViews) : 0,
        avgScrollDepth: combinedViews > 0 ? Math.round(combinedScrollDepth / combinedViews) : 0,
        engagementRate: combinedViews > 0 ? Math.round((combinedEngaged / combinedViews) * 100) : 0,
        bounceRate: combinedViews > 0 ? Math.round((combinedBounced / combinedViews) * 100) : 0,
      }
    })

    // Sort by period views
    postsWithAnalytics.sort((a, b) => b.periodViews - a.periodViews)

    // Overall blog stats
    const totalBlogViews = await prisma.pageView.count({
      where: {
        pageType: 'BLOG_POST',
        enteredAt: { gte: startDate },
      },
    })

    const avgBlogMetrics = await prisma.pageView.aggregate({
      where: {
        pageType: 'BLOG_POST',
        enteredAt: { gte: startDate },
      },
      _avg: {
        duration: true,
        scrollDepth: true,
      },
    })

    return NextResponse.json({
      overview: {
        totalViews: totalBlogViews,
        avgDuration: Math.round(avgBlogMetrics._avg.duration || 0),
        avgScrollDepth: Math.round(avgBlogMetrics._avg.scrollDepth || 0),
        totalPosts: blogPosts.length,
        publishedPosts: blogPosts.filter((p) => p.status === 'PUBLISHED').length,
      },
      posts: postsWithAnalytics,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    })
  } catch (error) {
    logger.error('Error fetching blog analytics:', error)
    return errorResponse('Failed to fetch blog analytics')
  }
}
