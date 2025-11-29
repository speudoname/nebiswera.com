// API endpoint for video uploads to Bunny Stream
import { NextRequest, NextResponse } from 'next/server'
import { uploadVideo } from '@/lib/storage/bunny'
import { nanoid } from 'nanoid'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Video file size limit: 500MB (Bunny handles larger files well)
const MAX_VIDEO_SIZE = 500 * 1024 * 1024

// Allowed video MIME types
const ALLOWED_MIME_TYPES = ['video/webm', 'video/mp4', 'video/quicktime']

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const title = formData.get('title') as string || `video-${nanoid()}`

    // Validate file exists and has required properties
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return NextResponse.json(
        { error: 'Invalid or missing video file' },
        { status: 400 }
      )
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate file size
    if (uploadFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video too large. Maximum size: ${Math.round(MAX_VIDEO_SIZE / 1024 / 1024)}MB` },
        { status: 413 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(uploadFile.type)) {
      return NextResponse.json(
        { error: `Invalid video type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
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
  } catch (error: any) {
    console.error('Error uploading video to Bunny:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    )
  }
}
