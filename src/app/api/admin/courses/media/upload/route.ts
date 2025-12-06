// API endpoint for uploading LMS course media
// Images/Audio/Files → Bunny Storage, Videos → Bunny Stream
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateLmsContentKey, type LmsMediaType } from '@/lib/storage'
import { uploadVideo } from '@/lib/storage/bunny'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB for videos
const MAX_AUDIO_SIZE = 100 * 1024 * 1024 // 100MB for audio
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024 // 50MB for documents

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'text/plain',
  'text/csv',
]

// Map from request media types to LmsMediaType
const mediaTypeMap: Record<string, LmsMediaType> = {
  video: 'videos',
  audio: 'audio',
  image: 'images',
  document: 'files',
}

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const courseId = formData.get('courseId') as string
    const requestMediaType = formData.get('mediaType') as string // 'video' | 'audio' | 'image' | 'document'

    // Validate required fields
    if (!courseId) {
      return badRequestResponse('Course ID is required')
    }

    if (!requestMediaType || !['video', 'audio', 'image', 'document'].includes(requestMediaType)) {
      return badRequestResponse('Valid media type is required (video, audio, image, document)')
    }

    // Validate file exists
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return badRequestResponse('Invalid or missing file')
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Determine allowed types and max size based on media type
    let allowedTypes: string[]
    let maxSize: number

    switch (requestMediaType) {
      case 'video':
        allowedTypes = ALLOWED_VIDEO_TYPES
        maxSize = MAX_VIDEO_SIZE
        break
      case 'audio':
        allowedTypes = ALLOWED_AUDIO_TYPES
        maxSize = MAX_AUDIO_SIZE
        break
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES
        maxSize = MAX_IMAGE_SIZE
        break
      case 'document':
        allowedTypes = ALLOWED_DOCUMENT_TYPES
        maxSize = MAX_DOCUMENT_SIZE
        break
      default:
        return badRequestResponse('Invalid media type')
    }

    // Validate file size
    if (uploadFile.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024)
      return badRequestResponse(`File too large. Maximum size: ${sizeMB}MB`)
    }

    // Validate MIME type
    if (!allowedTypes.includes(uploadFile.type)) {
      return badRequestResponse(`Invalid file type for ${requestMediaType}. Allowed types: ${allowedTypes.join(', ')}`)
    }

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (requestMediaType === 'video') {
      // Upload videos to Bunny Stream for proper streaming
      const title = uploadFile.name.replace(/\.[^/.]+$/, '') // Remove extension
      const result = await uploadVideo(title, buffer, uploadFile.type)

      return NextResponse.json({
        success: true,
        url: result.hlsUrl,
        bunnyVideoId: result.videoId,
        hlsUrl: result.hlsUrl,
        thumbnail: result.thumbnailUrl,
        embedUrl: result.embedUrl,
        mediaType: 'video',
        filename: uploadFile.name,
      })
    } else {
      // Upload to Bunny Storage for images, audio, and documents
      const sanitizedFilename = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const lmsMediaType = mediaTypeMap[requestMediaType]
      const key = generateLmsContentKey(courseId, lmsMediaType, sanitizedFilename)
      const url = await uploadToBunnyStorage(buffer, key)

      return NextResponse.json({
        success: true,
        url,
        key,
        mediaType: requestMediaType,
        filename: uploadFile.name,
        size: uploadFile.size,
        mimeType: uploadFile.type,
      })
    }
  } catch (error: unknown) {
    logger.error('Error uploading course media:', error)
    return errorResponse('Failed to upload media')
  }
}
