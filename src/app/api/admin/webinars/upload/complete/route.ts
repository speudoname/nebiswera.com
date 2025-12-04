import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

/**
 * POST /api/admin/webinars/upload/complete
 * Called after browser directly uploads to Bunny - marks upload as complete and starts processing
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { webinarId, videoId, fileSize } = body

    if (!webinarId || !videoId) {
      return NextResponse.json({ error: 'webinarId and videoId are required' }, { status: 400 })
    }

    logger.info('[Bunny Direct Upload] Upload complete notification:', { webinarId, videoId, fileSize })

    // Update processing job to PROCESSING status
    const job = await prisma.videoProcessingJob.update({
      where: { webinarId },
      data: {
        status: 'PROCESSING',
        progress: 0,
        originalSize: fileSize ? BigInt(fileSize) : null,
        startedAt: new Date(),
      },
    })

    // Update webinar status
    await prisma.webinar.update({
      where: { id: webinarId },
      data: {
        videoStatus: 'processing',
        hlsUrl: job.hlsUrl,
        thumbnailUrl: job.thumbnailUrl,
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'PROCESSING',
      message: 'Upload complete. Bunny is now transcoding the video.',
    })
  } catch (error) {
    logger.error('[Bunny Direct Upload] Failed to mark upload complete:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark upload complete' },
      { status: 500 }
    )
  }
}
