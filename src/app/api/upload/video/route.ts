// API endpoint for video uploads to Bunny Stream
import { NextRequest, NextResponse } from 'next/server'
import { uploadVideo } from '@/lib/storage/bunny'
import { nanoid } from 'nanoid'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthToken } from '@/lib/auth/utils'
import { logger, unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib'

export const runtime = 'nodejs'

// Video file size limit: 500MB (Bunny handles larger files well)
const MAX_VIDEO_SIZE = 500 * 1024 * 1024

// Allowed video MIME types
const ALLOWED_MIME_TYPES = ['video/webm', 'video/mp4', 'video/quicktime']

export async function POST(request: NextRequest) {
  // Authentication required
  const token = await getAuthToken(request)
  if (!token?.email) {
    return unauthorizedResponse()
  }

  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const title = formData.get('title') as string || `video-${nanoid()}`

    // Validate file exists and has required properties
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return badRequestResponse('Invalid or missing video file')
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate file size
    if (uploadFile.size > MAX_VIDEO_SIZE) {
      return errorResponse(`Video too large. Maximum size: ${Math.round(MAX_VIDEO_SIZE / 1024 / 1024)}MB`, 413)
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(uploadFile.type)) {
      return badRequestResponse(`Invalid video type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`)
    }

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Bunny Stream
    const result = await uploadVideo(title, buffer, uploadFile.type)

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      embedUrl: result.embedUrl,
    })
  } catch (error: unknown) {
    logger.error('Error uploading video to Bunny:', error)
    return errorResponse(error instanceof Error ? error.message : 'Failed to upload video')
  }
}
