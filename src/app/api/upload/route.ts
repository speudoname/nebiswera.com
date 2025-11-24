// API endpoint for generating presigned upload URLs
import { NextRequest, NextResponse } from 'next/server'
import { generateUploadUrl, generateTestimonialKey } from '@/lib/r2'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, contentType, filename } = body as {
      type: 'audio' | 'video' | 'image'
      contentType: string
      filename: string
    }

    if (!type || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: type, contentType' },
        { status: 400 }
      )
    }

    // Generate unique ID for this upload
    const uploadId = nanoid()

    // Get file extension from filename or default based on type
    const ext = filename?.split('.').pop() ||
                (type === 'audio' ? 'webm' : type === 'video' ? 'webm' : 'jpg')

    // Generate unique filename
    const uniqueFilename = `${type}-${Date.now()}.${ext}`
    const key = generateTestimonialKey(uploadId, uniqueFilename)

    // Generate presigned URL
    const { uploadUrl, publicUrl } = generateUploadUrl(key, contentType)

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    })
  } catch (error: any) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
