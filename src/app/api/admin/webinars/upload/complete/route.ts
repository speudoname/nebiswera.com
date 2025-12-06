import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { WebinarVideoStatus } from '@prisma/client'
import type { NextRequest } from 'next/server'

/**
 * POST /api/admin/webinars/upload/complete
 * Called after browser directly uploads to Bunny - marks upload as complete and starts processing
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { webinarId, videoId, fileSize } = body

    if (!webinarId || !videoId) {
      return badRequestResponse('webinarId and videoId are required')
    }

    logger.info('[Bunny Direct Upload] Upload complete notification:', { webinarId, videoId, fileSize })

    // Update processing job to PROCESSING status
    const job = await prisma.videoProcessingJob.update({
      where: { webinarId },
      data: {
        status: WebinarVideoStatus.PROCESSING,
        progress: 0,
        originalSize: fileSize ? BigInt(fileSize) : null,
        startedAt: new Date(),
      },
    })

    // Update webinar status
    await prisma.webinar.update({
      where: { id: webinarId },
      data: {
        videoStatus: WebinarVideoStatus.PROCESSING,
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
    return errorResponse(error instanceof Error ? error.message : 'Failed to mark upload complete')
  }
}
