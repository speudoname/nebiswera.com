// API endpoint for uploading webinar media to Bunny CDN
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateWebinarMediaKey } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'

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

    // Generate unique filename with folder structure
    const sanitizedFilename = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = generateWebinarMediaKey(sanitizedFilename, isVideo ? 'videos' : 'images')

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Bunny Storage
    const url = await uploadToBunnyStorage(buffer, key)

    return NextResponse.json({
      success: true,
      url,
      key,
      type: mediaType,
      name: uploadFile.name,
    })
  } catch (error: any) {
    console.error('Error uploading webinar media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
