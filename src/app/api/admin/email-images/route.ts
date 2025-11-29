// API endpoint for listing email campaign images from R2
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { isAdmin } from '@/lib/auth/utils'

export const runtime = 'nodejs'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'email-images/',
      MaxKeys: 100,
    })

    const response = await s3Client.send(command)

    const images = (response.Contents || [])
      .filter(obj => obj.Key && obj.Size && obj.Size > 0)
      .map(obj => ({
        key: obj.Key!,
        url: `${PUBLIC_URL}/${obj.Key}`,
        size: obj.Size!,
        lastModified: obj.LastModified?.toISOString(),
        name: obj.Key!.split('/').pop() || obj.Key!,
      }))
      .sort((a, b) => {
        // Sort by lastModified descending (newest first)
        if (a.lastModified && b.lastModified) {
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        }
        return 0
      })

    return NextResponse.json({ images })
  } catch (error: any) {
    console.error('Error listing email images:', error)
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    )
  }
}
