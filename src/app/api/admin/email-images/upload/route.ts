// API endpoint for uploading email campaign images to Bunny CDN
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, generateEmailImageKey } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'

export const runtime = 'nodejs'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    // Validate file exists
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return NextResponse.json(
        { error: 'Invalid or missing file' },
        { status: 400 }
      )
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate file size
    if (uploadFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `Image too large. Maximum size: 5MB` },
        { status: 413 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(uploadFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = uploadFile.name.split('.').pop() || 'jpg'
    const sanitizedFilename = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = generateEmailImageKey(`${sanitizedFilename}`)

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
    logger.error('Error uploading email image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
