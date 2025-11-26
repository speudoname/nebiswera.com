import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import {
  createPresignedUploadUrl,
  getWebinarOriginalKey,
  getPublicUrl,
} from '@/lib/storage/r2'
import { createTranscodingJob, getHlsUrl, getThumbnailUrl } from '@/lib/video/coconut'
import type { NextRequest } from 'next/server'

// POST /api/admin/webinars/upload - Get a presigned URL for R2 upload
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

    // Get file extension from filename or default to mp4
    const extension = fileName?.split('.').pop()?.toLowerCase() || 'mp4'
    const key = getWebinarOriginalKey(webinarId, extension)
    const mimeType = contentType || 'video/mp4'

    // Create presigned upload URL (valid for 2 hours for large uploads)
    const uploadUrl = await createPresignedUploadUrl(key, mimeType, 7200)
    const originalUrl = getPublicUrl(key)

    // Create or update processing job
    const job = await prisma.videoProcessingJob.upsert({
      where: { webinarId },
      create: {
        webinarId,
        status: 'PENDING',
        progress: 0,
        originalUrl,
        originalSize: fileSize ? BigInt(fileSize) : null,
      },
      update: {
        status: 'PENDING',
        progress: 0,
        originalUrl,
        originalSize: fileSize ? BigInt(fileSize) : null,
        error: null,
        startedAt: null,
        completedAt: null,
        hlsUrl: null,
        thumbnailUrl: null,
        duration: null,
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
      originalUrl,
      jobId: job.id,
      key,
    })
  } catch (error) {
    console.error('Failed to create upload URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webinars/upload - Confirm upload is complete and trigger Coconut transcoding
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

    // Create Coconut transcoding job
    const coconutJob = await createTranscodingJob({
      webinarId,
      inputUrl: existingJob.originalUrl,
    })

    // Update job with Coconut job ID and set status to PROCESSING
    const job = await prisma.videoProcessingJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        coconutJobId: coconutJob.id,
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      coconutJobId: coconutJob.id,
      status: job.status,
      message: 'Upload confirmed. Video is being transcoded by Coconut.',
    })
  } catch (error) {
    console.error('Failed to confirm upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm upload' },
      { status: 500 }
    )
  }
}

// GET /api/admin/webinars/upload?webinarId=xxx - Get video processing status
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
