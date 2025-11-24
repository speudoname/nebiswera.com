// Cloudflare R2 Storage utilities using AWS SDK S3 Client
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

// Log credentials validation (without exposing secrets)
console.log('R2 Config:', {
  accountId: R2_ACCOUNT_ID.substring(0, 8) + '...',
  accessKeyId: R2_ACCESS_KEY_ID.substring(0, 8) + '...',
  secretKeyLength: R2_SECRET_ACCESS_KEY.length,
  bucket: BUCKET_NAME,
  publicUrl: PUBLIC_URL,
})

// Create S3 client configured for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Upload a file to R2 using AWS SDK S3 Client
 */
export async function uploadToR2(
  file: Buffer | Blob,
  key: string,
  contentType: string
): Promise<string> {
  const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  try {
    await s3Client.send(command)
    // Return public URL
    return `${PUBLIC_URL}/${key}`
  } catch (error) {
    console.error('R2 upload error:', error)
    throw new Error(`R2 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a unique key for testimonial media
 */
export function generateTestimonialKey(testimonialId: string, filename: string): string {
  return `testimonials/${testimonialId}/${filename}`
}
