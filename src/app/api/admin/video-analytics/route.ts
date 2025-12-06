import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  listBunnyVideos,
  getBunnyThumbnailUrl,
  getBunnyHlsUrl,
  getVideoStatusText,
} from '@/lib/storage/bunny'

interface VideoAnalytics {
  videoId: string
  title: string
  thumbnail: string
  hlsUrl: string
  duration: number
  status: string
  dateUploaded: string
  storageSize: number
  // Analytics from Bunny
  bunnyViews: number
  // Analytics from our database
  dbViews: number
  uniqueViewers: number
  totalWatchTime: number // seconds
  averageWatchPercent: number
  completions: number
  // Usage context
  usedIn: {
    type: 'course' | 'webinar'
    id: string
    title: string
    slug?: string
  }[]
}

// GET /api/admin/video-analytics - List all videos with analytics
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)

  // Input validation with bounds
  const rawPage = parseInt(searchParams.get('page') || '1')
  const rawLimit = parseInt(searchParams.get('limit') || '50')

  if (isNaN(rawPage) || isNaN(rawLimit)) {
    return badRequestResponse('Invalid pagination parameters')
  }

  const page = Math.max(1, Math.min(rawPage, 1000)) // Max 1000 pages
  const limit = Math.max(1, Math.min(rawLimit, 100)) // Max 100 items per page
  const search = (searchParams.get('search') || '').substring(0, 100) // Limit search length

  try {
    // Fetch videos from Bunny
    const bunnyResult = await listBunnyVideos(page, limit)

    // Get all video IDs
    const videoIds = bunnyResult.videos.map((v) => v.guid)

    // Fetch analytics from CourseAnalyticsEvent (LMS)
    const courseVideoEvents = await prisma.courseAnalyticsEvent.groupBy({
      by: ['eventData'],
      where: {
        eventType: { in: ['VIDEO_STARTED', 'VIDEO_PROGRESS', 'VIDEO_COMPLETED'] },
      },
      _count: { id: true },
    })

    // Fetch video progress events with more detail
    const videoProgressEvents = await prisma.courseAnalyticsEvent.findMany({
      where: {
        eventType: { in: ['VIDEO_STARTED', 'VIDEO_PROGRESS', 'VIDEO_COMPLETED'] },
      },
      select: {
        eventType: true,
        eventData: true,
        partId: true,
        userId: true,
        anonymousId: true,
        createdAt: true,
      },
    })

    // Aggregate video analytics by partId (we'll map to bunnyVideoId later)
    const videoAnalyticsMap = new Map<string, {
      views: number
      uniqueViewers: Set<string>
      watchTimeSeconds: number
      completions: number
      progressPercents: number[]
    }>()

    for (const event of videoProgressEvents) {
      const partId = event.partId || 'unknown'
      if (!videoAnalyticsMap.has(partId)) {
        videoAnalyticsMap.set(partId, {
          views: 0,
          uniqueViewers: new Set(),
          watchTimeSeconds: 0,
          completions: 0,
          progressPercents: [],
        })
      }

      const stats = videoAnalyticsMap.get(partId)!
      const viewerId = event.userId || event.anonymousId || 'anonymous'
      stats.uniqueViewers.add(viewerId)

      if (event.eventType === 'VIDEO_STARTED') {
        stats.views++
      } else if (event.eventType === 'VIDEO_COMPLETED') {
        stats.completions++
      } else if (event.eventType === 'VIDEO_PROGRESS') {
        const data = event.eventData as Record<string, unknown>
        if (typeof data?.percent === 'number') {
          stats.progressPercents.push(data.percent as number)
        }
        if (typeof data?.watchTime === 'number') {
          stats.watchTimeSeconds += data.watchTime as number
        }
      }
    }

    // Fetch webinar video analytics
    const webinarVideoEvents = await prisma.webinarAnalyticsEvent.groupBy({
      by: ['webinarId'],
      where: {
        eventType: 'VIDEO_HEARTBEAT',
      },
      _count: { id: true },
    })

    // Get webinar registrations with watch time
    const webinarWatchData = await prisma.webinarRegistration.groupBy({
      by: ['webinarId'],
      _sum: { watchTimeSeconds: true },
      _count: { id: true },
      _avg: { engagementScore: true },
    })

    // Find which courses/webinars use each video
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        modules: {
          select: {
            lessons: {
              select: {
                parts: {
                  select: {
                    id: true,
                    contentBlocks: true,
                  },
                },
              },
            },
          },
        },
        lessons: {
          where: { moduleId: null },
          select: {
            parts: {
              select: {
                id: true,
                contentBlocks: true,
              },
            },
          },
        },
      },
    })

    const webinars = await prisma.webinar.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        hlsUrl: true,
      },
    })

    // Map bunny video IDs to their usage
    const videoUsageMap = new Map<string, VideoAnalytics['usedIn']>()

    // Check courses for video content blocks
    for (const course of courses) {
      const allParts = [
        ...course.modules.flatMap((m) => m.lessons.flatMap((l) => l.parts)),
        ...course.lessons.flatMap((l) => l.parts),
      ]

      for (const part of allParts) {
        const blocks = part.contentBlocks as unknown[]
        if (Array.isArray(blocks)) {
          for (const block of blocks) {
            const b = block as Record<string, unknown>
            if (b.type === 'video' && b.bunnyVideoId) {
              const videoId = b.bunnyVideoId as string
              if (!videoUsageMap.has(videoId)) {
                videoUsageMap.set(videoId, [])
              }
              const usages = videoUsageMap.get(videoId)!
              if (!usages.some((u) => u.type === 'course' && u.id === course.id)) {
                usages.push({
                  type: 'course',
                  id: course.id,
                  title: course.title,
                  slug: course.slug,
                })
              }
            }
          }
        }
      }
    }

    // Check webinars for video usage
    for (const webinar of webinars) {
      if (webinar.hlsUrl) {
        // Extract video ID from HLS URL
        const match = webinar.hlsUrl.match(/([a-f0-9-]{36})\/playlist\.m3u8/)
        if (match) {
          const videoId = match[1]
          if (!videoUsageMap.has(videoId)) {
            videoUsageMap.set(videoId, [])
          }
          videoUsageMap.get(videoId)!.push({
            type: 'webinar',
            id: webinar.id,
            title: webinar.title,
            slug: webinar.slug,
          })
        }
      }
    }

    // Build response with analytics
    const videosWithAnalytics: VideoAnalytics[] = bunnyResult.videos
      .filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()))
      .map((video) => {
        const usedIn = videoUsageMap.get(video.guid) || []

        // Get webinar analytics if used in a webinar
        let webinarViews = 0
        let webinarWatchTime = 0
        for (const usage of usedIn) {
          if (usage.type === 'webinar') {
            const webinarStats = webinarWatchData.find((w) => w.webinarId === usage.id)
            if (webinarStats) {
              webinarViews += webinarStats._count.id
              webinarWatchTime += webinarStats._sum.watchTimeSeconds || 0
            }
          }
        }

        return {
          videoId: video.guid,
          title: video.title,
          thumbnail: getBunnyThumbnailUrl(video.guid),
          hlsUrl: getBunnyHlsUrl(video.guid),
          duration: video.length,
          status: getVideoStatusText(video.status),
          dateUploaded: video.dateUploaded,
          storageSize: video.storageSize || 0,
          bunnyViews: video.views || 0,
          dbViews: webinarViews, // From webinar registrations
          uniqueViewers: webinarViews, // Approximation
          totalWatchTime: webinarWatchTime,
          averageWatchPercent: 0, // Would need more detailed calculation
          completions: 0,
          usedIn,
        }
      })

    return NextResponse.json({
      data: {
        videos: videosWithAnalytics,
        pagination: {
          page: bunnyResult.currentPage,
          limit: bunnyResult.itemsPerPage,
          total: bunnyResult.totalItems,
          totalPages: Math.ceil(bunnyResult.totalItems / bunnyResult.itemsPerPage),
        },
        summary: {
          totalVideos: bunnyResult.totalItems,
          totalStorageBytes: videosWithAnalytics.reduce((acc, v) => acc + v.storageSize, 0),
          totalDurationSeconds: videosWithAnalytics.reduce((acc, v) => acc + v.duration, 0),
          videosInUse: videosWithAnalytics.filter((v) => v.usedIn.length > 0).length,
          unusedVideos: videosWithAnalytics.filter((v) => v.usedIn.length === 0).length,
        },
      },
    })
  } catch (error) {
    logger.error('Failed to fetch video analytics:', error)
    return errorResponse('Failed to fetch video analytics')
  }
}
