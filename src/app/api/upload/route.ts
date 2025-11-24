// API endpoint for uploading files to R2
import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, generateTestimonialKey } from '@/lib/r2'
import { nanoid } from 'nanoid'

// Increase body size limit for video uploads (50MB)
export const maxDuration = 60 // 60 seconds for serverless function timeout
export const runtime = 'nodejs' // Use Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'audio' | 'video' | 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique ID for this upload
    const uploadId = nanoid()

    // Get file extension
    const ext = file.name.split('.').pop() || (type === 'audio' ? 'webm' : type === 'video' ? 'webm' : 'jpg')

    // Generate filename
    const filename = `${type}-${Date.now()}.${ext}`
    const key = generateTestimonialKey(uploadId, filename)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to R2
    const url = await uploadToR2(buffer, key, file.type)

    return NextResponse.json({
      success: true,
      url,
      key,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
