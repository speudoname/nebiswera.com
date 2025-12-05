// API endpoint for uploading webinar media
// Images → Bunny Storage, Videos → Bunny Stream
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateWebinarMediaKey } from '@/lib/bunny-storage'
import { uploadVideo } from '@/lib/storage/bunny'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'

export const runtime = 'nodejs'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB for videos

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const mediaType = formData.get('type') as string || 'images' // 'images' or 'videos'

    // Validate file exists
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return NextResponse.json(
        { error: 'Invalid or missing file' },
        { status: 400 }
      )
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Determine allowed types and max size based on media type
    const isVideo = mediaType === 'videos'
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

    // Validate file size
    if (uploadFile.size > maxSize) {
      const sizeLabel = isVideo ? '500MB' : '10MB'
      return NextResponse.json(
        { error: `File too large. Maximum size: ${sizeLabel}` },
        { status: 413 }
      )
    }

    // Validate MIME type
    if (!allowedTypes.includes(uploadFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (isVideo) {
      // Upload videos to Bunny Stream for proper streaming
      const title = uploadFile.name.replace(/\.[^/.]+$/, '') // Remove extension
      const result = await uploadVideo(title, buffer, uploadFile.type)

      return NextResponse.json({
        success: true,
        url: result.hlsUrl,
        videoId: result.videoId,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl,
        embedUrl: result.embedUrl,
        type: 'videos',
        name: uploadFile.name,
      })
    } else {
      // Upload images to Bunny Storage
      const sanitizedFilename = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const key = generateWebinarMediaKey(sanitizedFilename, 'images')
      const url = await uploadToBunnyStorage(buffer, key)

      return NextResponse.json({
        success: true,
        url,
        key,
        type: 'images',
        name: uploadFile.name,
      })
    }
  } catch (error: any) {
    logger.error('Error uploading webinar media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
