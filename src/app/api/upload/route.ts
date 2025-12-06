// API endpoint for server-side file uploads to Bunny CDN
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateUniqueFilename } from '@/lib/bunny-storage'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthToken } from '@/lib/auth/utils'
import { logger, unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib'

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
    const type = formData.get('type') as string

    // Validate file exists and has required properties
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return badRequestResponse('Invalid or missing file')
    }

    // Type assertion for file (FormData file can be Blob with additional properties)
    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate type parameter
    const validTypes = ['audio', 'video', 'image']
    if (!type || !validTypes.includes(type)) {
      return badRequestResponse('Invalid type. Must be: audio, video, or image')
    }

    const uploadType = type as 'audio' | 'video' | 'image'

    // Validate file size
    const maxSize = MAX_FILE_SIZES[uploadType]
    if (uploadFile.size > maxSize) {
      return errorResponse(`File too large. Maximum size for ${type}: ${Math.round(maxSize / 1024 / 1024)}MB`, 413)
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[uploadType]
    if (!allowedTypes.includes(uploadFile.type)) {
      return badRequestResponse(`Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}`)
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
  } catch (error: unknown) {
    logger.error('Error uploading file:', error)
    return errorResponse('Failed to upload file')
  }
}
