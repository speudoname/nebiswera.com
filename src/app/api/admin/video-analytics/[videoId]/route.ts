import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getBunnyVideo,
  getBunnyVideoStats,
  getBunnyThumbnailUrl,
  getBunnyHlsUrl,
  getVideoStatusText,
} from '@/lib/storage/bunny'

// UUID validation regex for Bunny video IDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteParams {
  params: Promise<{ videoId: string }>
}

// GET /api/admin/video-analytics/[videoId] - Get detailed analytics for a specific video
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { videoId } = await params

  // Validate videoId format (UUID)
  if (!UUID_REGEX.test(videoId)) {
    return badRequestResponse('Invalid video ID format')
  }

  try {
    // Fetch video details from Bunny
    let bunnyVideo
    try {
      bunnyVideo = await getBunnyVideo(videoId)
    } catch {
      return notFoundResponse('Video not found in Bunny')
    }

    // Get Bunny statistics
    const bunnyStats = await getBunnyVideoStats(videoId)

    // Find where this video is used in courses
    // Query parts directly (much more efficient than loading entire course hierarchy)
    const parts = await prisma.lmsPart.findMany({
      select: {
        id: true,
        title: true,
        contentBlocks: true,
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            moduleId: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            module: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    // Filter parts that contain this video (single pass through parts only)
    const usedInParts: {
      courseId: string
      courseTitle: string
      courseSlug: string
      moduleTitle?: string
      lessonTitle: string
      partId: string
      partTitle: string
    }[] = []

    for (const part of parts) {
      const blocks = part.contentBlocks as unknown[]
      if (!Array.isArray(blocks)) continue

      const hasVideo = blocks.some((block) => {
        const b = block as Record<string, unknown>
        return b.type === 'video' && b.bunnyVideoId === videoId
      })

      if (hasVideo && part.lesson) {
        usedInParts.push({
          courseId: part.lesson.course.id,
          courseTitle: part.lesson.course.title,
          courseSlug: part.lesson.course.slug,
          moduleTitle: part.lesson.module?.title,
          lessonTitle: part.lesson.title,
          partId: part.id,
          partTitle: part.title,
        })
      }
    }

    // Get part IDs that use this video
    const partIds = usedInParts.map((p) => p.partId)

    // Get analytics events for these parts
    const videoEvents = await prisma.courseAnalyticsEvent.findMany({
      where: {
        partId: { in: partIds },
        eventType: { in: ['VIDEO_STARTED', 'VIDEO_PROGRESS', 'VIDEO_COMPLETED'] },
      },
      select: {
        eventType: true,
        eventData: true,
        userId: true,
        anonymousId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get user info for events with userId
    const userIds = Array.from(new Set(videoEvents.filter((e) => e.userId).map((e) => e.userId!)))
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Aggregate viewer data
    const viewerData = new Map<string, {
      id: string
      name: string | null
      email: string | null
      image: string | null
      isAnonymous: boolean
      viewCount: number
      lastWatched: Date
      maxProgress: number
      totalWatchTime: number
      completed: boolean
    }>()

    for (const event of videoEvents) {
      const viewerId = event.userId || event.anonymousId || 'unknown'
      const user = event.userId ? userMap.get(event.userId) : null

      if (!viewerData.has(viewerId)) {
        viewerData.set(viewerId, {
          id: viewerId,
          name: user?.name || null,
          email: user?.email || null,
          image: user?.image || null,
          isAnonymous: !event.userId,
          viewCount: 0,
          lastWatched: event.createdAt,
          maxProgress: 0,
          totalWatchTime: 0,
          completed: false,
        })
      }

      const viewer = viewerData.get(viewerId)!

      if (event.eventType === 'VIDEO_STARTED') {
        viewer.viewCount++
      }

      if (event.eventType === 'VIDEO_COMPLETED') {
        viewer.completed = true
        viewer.maxProgress = 100
      }

      if (event.eventType === 'VIDEO_PROGRESS') {
        const data = event.eventData as Record<string, number>
        if (data.percent && data.percent > viewer.maxProgress) {
          viewer.maxProgress = data.percent
        }
        if (data.watchTime) {
          viewer.totalWatchTime = Math.max(viewer.totalWatchTime, data.watchTime)
        }
      }

      if (event.createdAt > viewer.lastWatched) {
        viewer.lastWatched = event.createdAt
      }
    }

    // Check webinars
    const webinars = await prisma.webinar.findMany({
      where: {
        hlsUrl: { contains: videoId },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })

    // Get webinar analytics if used in webinars
    let webinarAnalytics = null
    if (webinars.length > 0) {
      const webinarIds = webinars.map((w) => w.id)

      const registrations = await prisma.webinarRegistration.findMany({
        where: { webinarId: { in: webinarIds } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          watchTimeSeconds: true,
          maxVideoPosition: true,
          completedAt: true,
          engagementScore: true,
          joinedAt: true,
          leftAt: true,
        },
        orderBy: { watchTimeSeconds: 'desc' },
        take: 50,
      })

      const totalWatchTime = registrations.reduce((acc, r) => acc + (r.watchTimeSeconds || 0), 0)
      const completions = registrations.filter((r) => r.completedAt).length

      webinarAnalytics = {
        webinars: webinars.map((w) => ({ id: w.id, title: w.title, slug: w.slug })),
        totalRegistrations: registrations.length,
        totalWatchTimeSeconds: totalWatchTime,
        completions,
        averageWatchTime: registrations.length > 0 ? Math.round(totalWatchTime / registrations.length) : 0,
        topViewers: registrations.slice(0, 10).map((r) => ({
          id: r.id,
          name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Anonymous',
          email: r.email,
          watchTimeSeconds: r.watchTimeSeconds || 0,
          maxPosition: r.maxVideoPosition || 0,
          completed: !!r.completedAt,
          engagementScore: r.engagementScore || 0,
        })),
      }
    }

    // Calculate summary stats
    const viewers = Array.from(viewerData.values())
    const totalViews = viewers.reduce((acc, v) => acc + v.viewCount, 0)
    const completions = viewers.filter((v) => v.completed).length
    const avgProgress = viewers.length > 0
      ? Math.round(viewers.reduce((acc, v) => acc + v.maxProgress, 0) / viewers.length)
      : 0

    return NextResponse.json({
      data: {
        video: {
          id: bunnyVideo.guid,
          title: bunnyVideo.title,
          thumbnail: getBunnyThumbnailUrl(bunnyVideo.guid),
          hlsUrl: getBunnyHlsUrl(bunnyVideo.guid),
          duration: bunnyVideo.length,
          status: getVideoStatusText(bunnyVideo.status),
          dateUploaded: bunnyVideo.dateUploaded,
          encodeProgress: bunnyVideo.encodeProgress,
        },
        bunnyStats,
        usage: {
          courses: usedInParts,
          webinars: webinars.map((w) => ({ id: w.id, title: w.title, slug: w.slug })),
        },
        courseAnalytics: {
          totalViews,
          uniqueViewers: viewers.length,
          registeredViewers: viewers.filter((v) => !v.isAnonymous).length,
          anonymousViewers: viewers.filter((v) => v.isAnonymous).length,
          completions,
          completionRate: viewers.length > 0 ? Math.round((completions / viewers.length) * 100) : 0,
          averageProgress: avgProgress,
          viewers: viewers
            .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime())
            .slice(0, 50),
        },
        webinarAnalytics,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch video details:', error)
    return errorResponse('Failed to fetch video details')
  }
}
