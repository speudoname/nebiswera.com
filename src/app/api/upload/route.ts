// API endpoint for server-side file uploads to Bunny CDN
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateUniqueFilename } from '@/lib/bunny-storage'
import { nanoid } from 'nanoid'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// File size limits per type (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,  // 10MB
  audio: 50 * 1024 * 1024,  // 50MB
  video: 100 * 1024 * 1024, // 100MB
}

// Allowed MIME types per upload type
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav'],
  video: ['video/webm', 'video/mp4', 'video/quicktime'],
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type') as string

    // Validate file exists and has required properties
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return NextResponse.json(
        { error: 'Invalid or missing file' },
        { status: 400 }
      )
    }

    // Type assertion for file (FormData file can be Blob with additional properties)
    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate type parameter
    const validTypes = ['audio', 'video', 'image']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: audio, video, or image' },
        { status: 400 }
      )
    }

    const uploadType = type as 'audio' | 'video' | 'image'

    // Validate file size
    const maxSize = MAX_FILE_SIZES[uploadType]
    if (uploadFile.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size for ${type}: ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 413 }
      )
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[uploadType]
    if (!allowedTypes.includes(uploadFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(uploadFile.name)

    // Determine folder based on type
    const folder = uploadType === 'image' ? 'testimonials/images' :
                   uploadType === 'audio' ? 'testimonials/audio' :
                   'testimonials/video'

    const path = `${folder}/${uniqueFilename}`

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Bunny Storage
    const url = await uploadToBunnyStorage(buffer, path)

    return NextResponse.json({
      success: true,
      url,
      key: path,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
