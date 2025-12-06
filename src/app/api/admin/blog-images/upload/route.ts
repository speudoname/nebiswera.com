// API endpoint for uploading blog post images to Bunny CDN
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateBlogImageKey } from '@/lib/storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for blog images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    // Validate file exists
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return badRequestResponse('Invalid or missing file')
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate file size
    if (uploadFile.size > MAX_IMAGE_SIZE) {
      return badRequestResponse('Image too large. Maximum size: 10MB')
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(uploadFile.type)) {
      return badRequestResponse(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
    }

    // Generate unique filename
    const sanitizedFilename = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = generateBlogImageKey(sanitizedFilename)

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Bunny Storage
    const url = await uploadToBunnyStorage(buffer, key)

    return NextResponse.json({
      success: true,
      url,
      key,
    })
  } catch (error: unknown) {
    logger.error('Error uploading blog image:', error)
    return errorResponse('Failed to upload image')
  }
}
