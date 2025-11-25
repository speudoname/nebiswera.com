// Cloudflare R2 Storage utilities for server-side uploads
import crypto from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Validate required environment variables
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const R2_ACCOUNT_ID = getRequiredEnv('R2_ACCOUNT_ID')
const R2_ACCESS_KEY_ID = getRequiredEnv('R2_ACCESS_KEY_ID')
const R2_SECRET_ACCESS_KEY = getRequiredEnv('R2_SECRET_ACCESS_KEY')
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const PUBLIC_URL = getRequiredEnv('R2_PUBLIC_URL')

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Upload file to R2 (server-side)
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    // Return public URL
    return `${PUBLIC_URL}/${key}`
  } catch (error: any) {
    console.error('R2 upload error:', error)
    throw new Error(`Failed to upload to R2: ${error.message}`)
  }
}

/**
 * Generate a unique key for testimonial media
 */
export function generateTestimonialKey(testimonialId: string, filename: string): string {
  return `testimonials/${testimonialId}/${filename}`
}
