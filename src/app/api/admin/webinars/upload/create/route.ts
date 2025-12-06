import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { createBunnyVideo, getBunnyHlsUrl, getBunnyThumbnailUrl } from '@/lib/storage/bunny'
import { WebinarVideoStatus } from '@prisma/client'
import type { NextRequest } from 'next/server'

// Environment variables for Bunny
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!
const BUNNY_LIBRARY_API_KEY = process.env.BUNNY_LIBRARY_API_KEY!

/**
 * POST /api/admin/webinars/upload/create
 * Creates a video entry in Bunny and returns upload credentials for direct browser upload
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { webinarId, title } = body

    if (!webinarId) {
      return badRequestResponse('Webinar ID is required')
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    // Create video entry in Bunny
    const videoTitle = title || webinar.title || `webinar-${webinarId}`
    logger.info('[Bunny Direct Upload] Creating video entry:', videoTitle)

    const { videoId } = await createBunnyVideo(videoTitle)
    logger.info('[Bunny Direct Upload] Video created with ID:', videoId)

    // Create the direct upload URL
    // Bunny uses PUT to this URL with the video file as body
    const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`

    const hlsUrl = getBunnyHlsUrl(videoId)
    const thumbnailUrl = getBunnyThumbnailUrl(videoId)

    // Create or update processing job in database
    const job = await prisma.videoProcessingJob.upsert({
      where: { webinarId },
      create: {
        webinar: { connect: { id: webinarId } },
        status: WebinarVideoStatus.PENDING,
        progress: 0,
        originalUrl: hlsUrl, // We use the HLS URL as the "original" since we're doing direct upload
        bunnyVideoId: videoId,
        hlsUrl,
        thumbnailUrl,
      },
      update: {
        status: WebinarVideoStatus.PENDING,
        progress: 0,
        originalUrl: hlsUrl,
        bunnyVideoId: videoId,
        hlsUrl,
        thumbnailUrl,
        error: null,
        startedAt: null,
        completedAt: null,
        duration: null,
      },
    })

    return NextResponse.json({
      success: true,
      videoId,
      uploadUrl,
      authKey: BUNNY_LIBRARY_API_KEY,
      libraryId: BUNNY_LIBRARY_ID,
      jobId: job.id,
      hlsUrl,
      thumbnailUrl,
    })
  } catch (error) {
    logger.error('[Bunny Direct Upload] Failed to create upload:', error)
    return errorResponse(error instanceof Error ? error.message : 'Failed to create upload')
  }
}
