import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import {
  createPresignedUploadUrl,
  createTranscodingJob,
  getJobStatus,
  getHlsUrl,
  getThumbnailUrl,
  copyTranscodedToR2,
} from '@/lib/video/mediaconvert'
import type { NextRequest } from 'next/server'

// POST /api/admin/webinars/upload - Get a presigned URL for S3 upload
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { webinarId, fileName, fileSize, contentType } = body

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

    const mimeType = contentType || 'video/mp4'

    // Create presigned URL for S3 upload
    const { uploadUrl, s3Key, s3Url } = await createPresignedUploadUrl(webinarId, mimeType, 7200)

    // Create or update processing job
    const job = await prisma.videoProcessingJob.upsert({
      where: { webinarId },
      create: {
        webinarId,
        status: 'PENDING',
        progress: 0,
        originalUrl: s3Url,
        originalSize: fileSize ? BigInt(fileSize) : null,
      },
      update: {
        status: 'PENDING',
        progress: 0,
        originalUrl: s3Url,
        originalSize: fileSize ? BigInt(fileSize) : null,
        error: null,
        startedAt: null,
        completedAt: null,
        hlsUrl: null,
        thumbnailUrl: null,
        duration: null,
        coconutJobId: null,
      },
    })

    // Update webinar video status
    await prisma.webinar.update({
      where: { id: webinarId },
      data: {
        videoStatus: 'processing',
        hlsUrl: null,
        thumbnailUrl: null,
        videoDuration: null,
      },
    })

    return NextResponse.json({
      uploadUrl,
      originalUrl: s3Url,
      jobId: job.id,
      key: s3Key,
    })
  } catch (error) {
    console.error('Failed to create upload URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webinars/upload - Confirm upload and start MediaConvert transcoding
export async function PUT(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { webinarId, jobId } = body

    if (!webinarId || !jobId) {
      return NextResponse.json({ error: 'Webinar ID and Job ID are required' }, { status: 400 })
    }

    // Get the job to access the original URL
    const existingJob = await prisma.videoProcessingJob.findUnique({
      where: { id: jobId },
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Create MediaConvert transcoding job
    const transcodingJob = await createTranscodingJob({
      webinarId,
      videoType: 'webinar',
      inputUrl: existingJob.originalUrl,
    })

    // Update job with transcoding job ID and set status to PROCESSING
    const job = await prisma.videoProcessingJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        coconutJobId: transcodingJob.id, // Using coconutJobId field for MediaConvert job ID
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      transcodingJobId: transcodingJob.id,
      status: job.status,
      message: 'Upload confirmed. Video is being transcoded by AWS MediaConvert.',
    })
  } catch (error) {
    console.error('Failed to confirm upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm upload' },
      { status: 500 }
    )
  }
}

// GET /api/admin/webinars/upload?webinarId=xxx - Get video processing status with progress
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
    let job = await prisma.videoProcessingJob.findUnique({
      where: { webinarId },
    })

    if (!job) {
      return NextResponse.json({ error: 'No video processing job found' }, { status: 404 })
    }

    // If job is PROCESSING, poll MediaConvert for real-time progress
    if (job.status === 'PROCESSING' && job.coconutJobId) {
      try {
        const mcStatus = await getJobStatus(job.coconutJobId)
        console.log(`MediaConvert status for ${job.coconutJobId}: ${mcStatus.status}, progress: ${mcStatus.progress}%`)

        // Update progress in database if changed
        if (mcStatus.progress !== job.progress) {
          await prisma.videoProcessingJob.update({
            where: { id: job.id },
            data: { progress: Math.round(mcStatus.progress) },
          })
          job = { ...job, progress: Math.round(mcStatus.progress) }
        }

        // Check if MediaConvert job completed
        if (mcStatus.status === 'COMPLETE') {
          console.log(`MediaConvert job completed for webinar: ${webinarId}. Copying to R2...`)

          // Copy transcoded files from S3 to R2
          const { hlsUrl, thumbnailUrl } = await copyTranscodedToR2(webinarId)

          // Update processing job
          await prisma.videoProcessingJob.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              progress: 100,
              hlsUrl,
              thumbnailUrl,
              completedAt: new Date(),
              error: null,
            },
          })

          // Update webinar
          await prisma.webinar.update({
            where: { id: webinarId },
            data: {
              videoStatus: 'ready',
              hlsUrl,
              thumbnailUrl,
            },
          })

          console.log(`Video ready for webinar: ${webinarId}`)

          return NextResponse.json({
            jobId: job.id,
            status: 'COMPLETED',
            progress: 100,
            originalUrl: job.originalUrl,
            hlsUrl,
            thumbnailUrl,
            duration: null,
            error: null,
            startedAt: job.startedAt,
            completedAt: new Date(),
            videoStatus: 'ready',
          })
        }

        // Check if job failed
        if (mcStatus.status === 'ERROR' || mcStatus.status === 'CANCELED') {
          const errorMessage = mcStatus.errorMessage || 'MediaConvert transcoding failed'

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
            progress: job.progress,
            originalUrl: job.originalUrl,
            hlsUrl: null,
            thumbnailUrl: null,
            duration: null,
            error: errorMessage,
            startedAt: job.startedAt,
            completedAt: new Date(),
            videoStatus: 'error',
          })
        }
      } catch (pollError) {
        console.error('Failed to poll MediaConvert:', pollError)
        // Continue with local status if polling fails
      }
    }

    // Return current status
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
      originalUrl: job.originalUrl,
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
