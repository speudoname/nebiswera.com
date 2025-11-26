import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getHlsUrl, getThumbnailUrl } from '@/lib/video/coconut'
import type { NextRequest } from 'next/server'

// Coconut webhook payload types
interface CoconutWebhookPayload {
  id: string // Job ID
  status: string // e.g., 'job.completed', 'job.failed', 'output.completed'
  progress?: number
  event?: string
  metadata?: {
    webinarId?: string
  }
  input?: {
    status: string
    metadata?: {
      duration?: number
      width?: number
      height?: number
    }
  }
  outputs?: Record<string, {
    status: string
    key?: string
    urls?: string[]
    error?: string
  }>
  error?: {
    code: string
    message: string
  }
}

// POST /api/webhooks/coconut - Handle Coconut transcoding notifications
export async function POST(request: NextRequest) {
  // Log request details for debugging
  const headers = Object.fromEntries(request.headers.entries())
  console.log('Coconut webhook request received:', {
    method: request.method,
    url: request.url,
    userAgent: headers['user-agent'],
    contentType: headers['content-type'],
    timestamp: new Date().toISOString(),
  })

  try {
    const payload: CoconutWebhookPayload = await request.json()

    console.log('Coconut webhook payload:', JSON.stringify(payload, null, 2))

    const coconutJobId = payload.id
    const webinarId = payload.metadata?.webinarId

    if (!coconutJobId) {
      console.error('No job ID in Coconut webhook')
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
    }

    // Find the processing job by Coconut job ID
    const job = await prisma.videoProcessingJob.findFirst({
      where: { coconutJobId },
    })

    if (!job) {
      // Try finding by webinarId from metadata if available
      if (webinarId) {
        const jobByWebinar = await prisma.videoProcessingJob.findUnique({
          where: { webinarId },
        })
        if (jobByWebinar) {
          // Update the job with the Coconut job ID
          await prisma.videoProcessingJob.update({
            where: { id: jobByWebinar.id },
            data: { coconutJobId },
          })
        }
      }

      console.log(`Job not found for Coconut ID: ${coconutJobId}`)
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true })
    }

    // Handle different webhook statuses
    const status = payload.status

    // Job completed successfully
    if (status === 'job.completed') {
      const duration = payload.input?.metadata?.duration
        ? Math.round(payload.input.metadata.duration)
        : null

      // Update processing job
      await prisma.videoProcessingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          hlsUrl: getHlsUrl(job.webinarId),
          thumbnailUrl: getThumbnailUrl(job.webinarId),
          duration,
          completedAt: new Date(),
          error: null,
        },
      })

      // Update webinar with video info
      await prisma.webinar.update({
        where: { id: job.webinarId },
        data: {
          videoStatus: 'ready',
          hlsUrl: getHlsUrl(job.webinarId),
          thumbnailUrl: getThumbnailUrl(job.webinarId),
          videoDuration: duration,
        },
      })

      console.log(`Transcoding completed for webinar: ${job.webinarId}`)
    }
    // Job failed
    else if (status === 'job.failed') {
      const errorMessage = payload.error?.message || 'Transcoding failed'

      await prisma.videoProcessingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
          completedAt: new Date(),
        },
      })

      await prisma.webinar.update({
        where: { id: job.webinarId },
        data: {
          videoStatus: 'error',
        },
      })

      console.error(`Transcoding failed for webinar: ${job.webinarId}`, errorMessage)
    }
    // Progress update
    else if (payload.progress !== undefined) {
      await prisma.videoProcessingJob.update({
        where: { id: job.id },
        data: {
          progress: Math.round(payload.progress),
          status: 'PROCESSING',
        },
      })

      console.log(`Transcoding progress for webinar ${job.webinarId}: ${payload.progress}%`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Coconut webhook error:', error)
    // Return 200 anyway to prevent Coconut from retrying
    return NextResponse.json({
      received: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Coconut webhook endpoint is active'
  })
}
