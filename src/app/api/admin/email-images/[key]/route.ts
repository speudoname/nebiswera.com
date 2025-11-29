// API endpoint for deleting email campaign images from R2
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { isAdmin } from '@/lib/auth/utils'

export const runtime = 'nodejs'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { key } = await params
    const decodedKey = decodeURIComponent(key)

    // Security check: only allow deleting from email-images folder
    if (!decodedKey.startsWith('email-images/')) {
      return NextResponse.json(
        { error: 'Invalid key: can only delete from email-images folder' },
        { status: 400 }
      )
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: decodedKey,
    })

    await s3Client.send(command)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting email image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
