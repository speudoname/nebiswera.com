import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import {
  uploadVideo,
  getBunnyVideo,
  getBunnyHlsUrl,
  getBunnyThumbnailUrl,
  isVideoReady,
  isVideoProcessing,
  hasVideoError,
  getVideoStatusText,
} from '@/lib/video/bunny'
import type { NextRequest } from 'next/server'

// POST /api/admin/webinars/upload - Upload video directly to Bunny
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const webinarId = formData.get('webinarId') as string
    const title = formData.get('title') as string

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 })
    }

    if (!webinarId) {
      return NextResponse.json({ error: 'Webinar ID is required' }, { status: 400 })
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Convert to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Bunny Stream
    const videoTitle = title || webinar.title || `webinar-${webinarId}`
    const result = await uploadVideo(videoTitle, buffer, uploadFile.type)

    // Create or update processing job
    const job = await prisma.videoProcessingJob.upsert({
      where: { webinarId },
      create: {
        webinarId,
        status: 'PROCESSING',
        progress: 0,
        originalUrl: result.hlsUrl,
        originalSize: BigInt(uploadFile.size),
        bunnyVideoId: result.videoId,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl,
        startedAt: new Date(),
      },
      update: {
        status: 'PROCESSING',
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
        videoStatus: 'processing',
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
    console.error('Failed to upload video to Bunny:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload video' },
      { status: 500 }
    )
  }
}

// GET /api/admin/webinars/upload?webinarId=xxx - Get video processing status from Bunny
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const webinarId = searchParams.get('webinarId')

  if (!webinarId) {
    return NextResponse.json({ error: 'Webinar ID required' }, { status: 400 })
  }

  try {
    const job = await prisma.videoProcessingJob.findUnique({
      where: { webinarId },
    })

    if (!job) {
      return NextResponse.json({ error: 'No video processing job found' }, { status: 404 })
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
              status: 'COMPLETED',
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
              videoStatus: 'ready',
              hlsUrl,
              thumbnailUrl,
              videoDuration: bunnyVideo.length || null,
            },
          })

          return NextResponse.json({
            jobId: job.id,
            status: 'COMPLETED',
            progress: 100,
            hlsUrl,
            thumbnailUrl,
            duration: bunnyVideo.length,
            error: null,
            videoStatus: 'ready',
          })
        }

        if (hasVideoError(bunnyVideo)) {
          const errorMessage = `Bunny transcoding failed: ${getVideoStatusText(bunnyVideo.status)}`

          await prisma.videoProcessingJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              error: errorMessage,
              completedAt: new Date(),
            },
          })

          await prisma.webinar.update({
            where: { id: webinarId },
            data: { videoStatus: 'error' },
          })

          return NextResponse.json({
            jobId: job.id,
            status: 'FAILED',
            progress: 0,
            error: errorMessage,
            videoStatus: 'error',
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
          status: 'PROCESSING',
          progress,
          hlsUrl: job.hlsUrl,
          thumbnailUrl: job.thumbnailUrl,
          error: null,
          videoStatus: 'processing',
          bunnyStatus: getVideoStatusText(bunnyVideo.status),
        })
      } catch (pollError) {
        console.error('Failed to poll Bunny status:', pollError)
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
    console.error('Failed to get video status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get video status' },
      { status: 500 }
    )
  }
}
