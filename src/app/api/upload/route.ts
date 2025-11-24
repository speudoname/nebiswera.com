// API endpoint for server-side file uploads to R2
import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, generateTestimonialKey } from '@/lib/r2'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'audio' | 'video' | 'image'

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: file, type' },
        { status: 400 }
      )
    }

    // Generate unique ID for this upload
    const uploadId = nanoid()

    // Get file extension
    const ext = file.name.split('.').pop() ||
                (type === 'audio' ? 'webm' : type === 'video' ? 'webm' : 'jpg')

    // Generate unique filename
    const uniqueFilename = `${type}-${Date.now()}.${ext}`
    const key = generateTestimonialKey(uploadId, uniqueFilename)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to R2
    const url = await uploadToR2(buffer, key, file.type)

    return NextResponse.json({
      success: true,
      url,
      key,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
