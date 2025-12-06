import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import {
  uploadVideo,
  getBunnyVideo,
  getBunnyHlsUrl,
  getBunnyThumbnailUrl,
  isVideoReady,
  isVideoProcessing,
  hasVideoError,
  getVideoStatusText,
} from '@/lib/storage/bunny'
import { WebinarVideoStatus } from '@prisma/client'
import type { NextRequest } from 'next/server'

// POST /api/admin/webinars/upload - Upload video directly to Bunny
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    logger.info('[Webinar Upload] Starting upload request...')

    const formData = await request.formData()
    const file = formData.get('file')
    const webinarId = formData.get('webinarId') as string
    const title = formData.get('title') as string

    logger.info('[Webinar Upload] Form data received:', { webinarId, title, hasFile: !!file })

    if (!file || typeof file === 'string') {
      logger.error('[Webinar Upload] No file provided')
      return badRequestResponse('Video file is required')
    }

    if (!webinarId) {
      logger.error('[Webinar Upload] No webinarId provided')
      return badRequestResponse('Webinar ID is required')
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
    })

    if (!webinar) {
      logger.error('[Webinar Upload] Webinar not found:', webinarId)
      return notFoundResponse('Webinar not found')
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }
    logger.info('[Webinar Upload] File details:', {
      name: uploadFile.name,
      size: uploadFile.size,
      type: uploadFile.type,
      sizeInMB: (uploadFile.size / (1024 * 1024)).toFixed(2),
    })

    // Convert to buffer
    logger.info('[Webinar Upload] Converting to buffer...')
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    logger.info('[Webinar Upload] Buffer created, size:', buffer.length)

    // Upload to Bunny Stream
    const videoTitle = title || webinar.title || `webinar-${webinarId}`
    logger.info('[Webinar Upload] Uploading to Bunny with title:', videoTitle)

    const result = await uploadVideo(videoTitle, buffer, uploadFile.type)
    logger.info('[Webinar Upload] Bunny upload result:', result)

    // Create or update processing job
    const job = await prisma.videoProcessingJob.upsert({
      where: { webinarId },
      create: {
        webinarId,
        status: WebinarVideoStatus.PROCESSING,
        progress: 0,
        originalUrl: result.hlsUrl,
        originalSize: BigInt(uploadFile.size),
        bunnyVideoId: result.videoId,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl,
        startedAt: new Date(),
      },
      update: {
        status: WebinarVideoStatus.PROCESSING,
        progress: 0,
        originalUrl: result.hlsUrl,
        originalSize: BigInt(uploadFile.size),
        bunnyVideoId: result.videoId,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
      },
    })

    // Update webinar with video URLs (will be available once processed)
    await prisma.webinar.update({
      where: { id: webinarId },
      data: {
        videoStatus: WebinarVideoStatus.PROCESSING,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl,
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      videoId: result.videoId,
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      message: 'Video uploaded to Bunny. Transcoding in progress.',
    })
  } catch (error) {
    logger.error('Failed to upload video to Bunny:', error)
    return errorResponse(error instanceof Error ? error.message : 'Failed to upload video')
  }
}

// GET /api/admin/webinars/upload?webinarId=xxx - Get video processing status from Bunny
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const webinarId = searchParams.get('webinarId')

  if (!webinarId) {
    return badRequestResponse('Webinar ID required')
  }

  try {
    const job = await prisma.videoProcessingJob.findUnique({
      where: { webinarId },
    })

    if (!job) {
      return notFoundResponse('No video processing job found')
    }

    // If job is PROCESSING, check Bunny for real-time status
    if (job.status === 'PROCESSING' && job.bunnyVideoId) {
      try {
        const bunnyVideo = await getBunnyVideo(job.bunnyVideoId)

        // Update progress based on encode progress
        const progress = bunnyVideo.encodeProgress || 0

        if (isVideoReady(bunnyVideo)) {
          // Video is ready!
          const hlsUrl = getBunnyHlsUrl(job.bunnyVideoId)
          const thumbnailUrl = getBunnyThumbnailUrl(job.bunnyVideoId)

          await prisma.videoProcessingJob.update({
            where: { id: job.id },
            data: {
              status: WebinarVideoStatus.READY,
              progress: 100,
              hlsUrl,
              thumbnailUrl,
              duration: bunnyVideo.length || null,
              completedAt: new Date(),
              error: null,
            },
          })

          await prisma.webinar.update({
            where: { id: webinarId },
            data: {
              videoStatus: WebinarVideoStatus.READY,
              hlsUrl,
              thumbnailUrl,
              videoDuration: bunnyVideo.length || null,
            },
          })

          return NextResponse.json({
            jobId: job.id,
            status: WebinarVideoStatus.READY,
            progress: 100,
            hlsUrl,
            thumbnailUrl,
            duration: bunnyVideo.length,
            error: null,
            videoStatus: WebinarVideoStatus.READY,
          })
        }

        if (hasVideoError(bunnyVideo)) {
          const errorMessage = `Bunny transcoding failed: ${getVideoStatusText(bunnyVideo.status)}`

          await prisma.videoProcessingJob.update({
            where: { id: job.id },
            data: {
              status: WebinarVideoStatus.FAILED,
              error: errorMessage,
              completedAt: new Date(),
            },
          })

          await prisma.webinar.update({
            where: { id: webinarId },
            data: { videoStatus: WebinarVideoStatus.FAILED },
          })

          return NextResponse.json({
            jobId: job.id,
            status: WebinarVideoStatus.FAILED,
            progress: 0,
            error: errorMessage,
            videoStatus: WebinarVideoStatus.FAILED,
          })
        }

        // Still processing
        if (progress !== job.progress) {
          await prisma.videoProcessingJob.update({
            where: { id: job.id },
            data: { progress },
          })
        }

        return NextResponse.json({
          jobId: job.id,
          status: WebinarVideoStatus.PROCESSING,
          progress,
          hlsUrl: job.hlsUrl,
          thumbnailUrl: job.thumbnailUrl,
          error: null,
          videoStatus: WebinarVideoStatus.PROCESSING,
          bunnyStatus: getVideoStatusText(bunnyVideo.status),
        })
      } catch (pollError) {
        logger.error('Failed to poll Bunny status:', pollError)
        // Return current status if polling fails
      }
    }

    // Return current status from database
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      select: {
        hlsUrl: true,
        thumbnailUrl: true,
        videoDuration: true,
        videoStatus: true,
      },
    })

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      hlsUrl: job.hlsUrl || webinar?.hlsUrl,
      thumbnailUrl: job.thumbnailUrl || webinar?.thumbnailUrl,
      duration: job.duration || webinar?.videoDuration,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      videoStatus: webinar?.videoStatus,
    })
  } catch (error) {
    logger.error('Failed to get video status:', error)
    return errorResponse(error instanceof Error ? error.message : 'Failed to get video status')
  }
}
