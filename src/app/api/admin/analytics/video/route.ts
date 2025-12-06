import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

/**
 * GET /api/admin/analytics/video
 * Get video analytics data
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get video events from CourseAnalyticsEvent (course videos)
    const courseVideoEvents = await prisma.courseAnalyticsEvent.findMany({
      where: {
        createdAt: { gte: startDate },
        eventType: {
          in: ['VIDEO_STARTED', 'VIDEO_PROGRESS', 'VIDEO_COMPLETED', 'VIDEO_PAUSED', 'VIDEO_SEEKED', 'VIDEO_UNMUTED'],
        },
      },
      select: {
        id: true,
        eventType: true,
        eventData: true,
        lessonId: true,
        courseId: true,
        userId: true,
        anonymousId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get video events from PageEvent (page videos)
    const pageVideoEvents = await prisma.pageEvent.findMany({
      where: {
        createdAt: { gte: startDate },
        eventType: {
          in: ['VIDEO_PLAY', 'VIDEO_PAUSE'],
        },
      },
      select: {
        id: true,
        eventType: true,
        metadata: true,
        targetUrl: true,
        pageViewId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get associated PageViews for page video events
    const pageViewIds = Array.from(new Set(pageVideoEvents.map((e) => e.pageViewId)))
    const pageViews = await prisma.pageView.findMany({
      where: { id: { in: pageViewIds } },
      select: { id: true, path: true, pageType: true },
    })
    const pageViewMap = new Map(pageViews.map((pv) => [pv.id, pv]))

    // Get course titles for course video events
    const courseIds = Array.from(new Set(courseVideoEvents.map((e) => e.courseId)))
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    })
    const courseMap = new Map(courses.map((c) => [c.id, c]))

    // Get lesson titles for lesson video events
    const lessonIds = Array.from(new Set(courseVideoEvents.map((e) => e.lessonId).filter(Boolean))) as string[]
    const lessons = await prisma.lmsLesson.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, title: true },
    })
    const lessonMap = new Map(lessons.map((l) => [l.id, l]))

    // Calculate overview stats
    const videoStarts = courseVideoEvents.filter((e) => e.eventType === 'VIDEO_STARTED').length
    const videoCompletes = courseVideoEvents.filter((e) => e.eventType === 'VIDEO_COMPLETED').length
    const pageVideoPlays = pageVideoEvents.filter((e) => e.eventType === 'VIDEO_PLAY').length

    // Unique viewers (by userId or anonymousId)
    const uniqueViewers = new Set([
      ...courseVideoEvents.map((e) => e.userId || e.anonymousId).filter(Boolean),
    ]).size

    // Completion rate
    const completionRate = videoStarts > 0 ? Math.round((videoCompletes / videoStarts) * 100) : 0

    // Average progress from VIDEO_PROGRESS events
    const progressEvents = courseVideoEvents.filter((e) => e.eventType === 'VIDEO_PROGRESS')
    const avgProgress = progressEvents.length > 0
      ? Math.round(
          progressEvents.reduce((sum, e) => {
            const data = e.eventData as { progress?: number } | null
            return sum + (data?.progress || 0)
          }, 0) / progressEvents.length
        )
      : 0

    // Video stats by course
    const courseStats = new Map<string, { starts: number; completes: number; progress: number[] }>()
    for (const event of courseVideoEvents) {
      if (!courseStats.has(event.courseId)) {
        courseStats.set(event.courseId, { starts: 0, completes: 0, progress: [] })
      }
      const stats = courseStats.get(event.courseId)!
      if (event.eventType === 'VIDEO_STARTED') stats.starts++
      if (event.eventType === 'VIDEO_COMPLETED') stats.completes++
      if (event.eventType === 'VIDEO_PROGRESS') {
        const data = event.eventData as { progress?: number } | null
        if (data?.progress) stats.progress.push(data.progress)
      }
    }

    // Video stats by lesson
    const lessonStats = new Map<string, { starts: number; completes: number; courseId: string }>()
    for (const event of courseVideoEvents) {
      if (!event.lessonId) continue
      if (!lessonStats.has(event.lessonId)) {
        lessonStats.set(event.lessonId, { starts: 0, completes: 0, courseId: event.courseId })
      }
      const stats = lessonStats.get(event.lessonId)!
      if (event.eventType === 'VIDEO_STARTED') stats.starts++
      if (event.eventType === 'VIDEO_COMPLETED') stats.completes++
    }

    // Daily video views
    const dailyViews = new Map<string, number>()
    for (const event of courseVideoEvents) {
      if (event.eventType === 'VIDEO_STARTED') {
        const dateKey = event.createdAt.toISOString().split('T')[0]
        dailyViews.set(dateKey, (dailyViews.get(dateKey) || 0) + 1)
      }
    }
    for (const event of pageVideoEvents) {
      if (event.eventType === 'VIDEO_PLAY') {
        const dateKey = event.createdAt.toISOString().split('T')[0]
        dailyViews.set(dateKey, (dailyViews.get(dateKey) || 0) + 1)
      }
    }

    // Page video breakdown
    const pageVideoStats = new Map<string, number>()
    for (const event of pageVideoEvents) {
      const pageView = pageViewMap.get(event.pageViewId)
      if (event.eventType === 'VIDEO_PLAY' && pageView?.path) {
        const path = pageView.path
        pageVideoStats.set(path, (pageVideoStats.get(path) || 0) + 1)
      }
    }

    // Recent video events
    const recentEvents = [
      ...courseVideoEvents.slice(0, 25).map((e) => ({
        type: 'course' as const,
        eventType: e.eventType,
        courseId: e.courseId,
        courseName: courseMap.get(e.courseId)?.title || 'Unknown',
        lessonId: e.lessonId,
        lessonName: e.lessonId ? lessonMap.get(e.lessonId)?.title || 'Unknown' : null,
        eventData: e.eventData,
        createdAt: e.createdAt,
      })),
      ...pageVideoEvents.slice(0, 25).map((e) => {
        const pageView = pageViewMap.get(e.pageViewId)
        return {
          type: 'page' as const,
          eventType: e.eventType,
          path: pageView?.path || 'Unknown',
          pageType: pageView?.pageType || 'Unknown',
          targetUrl: e.targetUrl,
          metadata: e.metadata,
          createdAt: e.createdAt,
        }
      }),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return NextResponse.json({
      overview: {
        totalVideoStarts: videoStarts + pageVideoPlays,
        courseVideoStarts: videoStarts,
        pageVideoPlays,
        videoCompletes,
        completionRate,
        avgProgress,
        uniqueViewers,
      },
      courseStats: Array.from(courseStats.entries())
        .map(([courseId, stats]) => ({
          courseId,
          courseName: courseMap.get(courseId)?.title || 'Unknown',
          starts: stats.starts,
          completes: stats.completes,
          completionRate: stats.starts > 0 ? Math.round((stats.completes / stats.starts) * 100) : 0,
          avgProgress: stats.progress.length > 0
            ? Math.round(stats.progress.reduce((a, b) => a + b, 0) / stats.progress.length)
            : 0,
        }))
        .sort((a, b) => b.starts - a.starts),
      lessonStats: Array.from(lessonStats.entries())
        .map(([lessonId, stats]) => ({
          lessonId,
          lessonName: lessonMap.get(lessonId)?.title || 'Unknown',
          courseName: courseMap.get(stats.courseId)?.title || 'Unknown',
          starts: stats.starts,
          completes: stats.completes,
          completionRate: stats.starts > 0 ? Math.round((stats.completes / stats.starts) * 100) : 0,
        }))
        .sort((a, b) => b.starts - a.starts)
        .slice(0, 20),
      pageVideoStats: Array.from(pageVideoStats.entries())
        .map(([path, plays]) => ({ path, plays }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 15),
      dailyViews: Array.from(dailyViews.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentEvents: recentEvents.slice(0, 30),
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    })
  } catch (error) {
    logger.error('Error fetching video analytics:', error)
    return errorResponse('Failed to fetch video analytics')
  }
}
