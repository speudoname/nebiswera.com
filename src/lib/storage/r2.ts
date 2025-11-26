// Cloudflare R2 Storage utilities for server-side uploads
import crypto from 'crypto'
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

export { BUCKET_NAME, PUBLIC_URL }

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

// ===========================================
// Webinar Video Storage
// ===========================================

/**
 * Generate a presigned URL for direct browser upload to R2
 * Used for large video uploads that bypass the API
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600 // 1 hour default
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  })

  return signedUrl
}

/**
 * Generate key for webinar original video
 */
export function getWebinarOriginalKey(webinarId: string, extension: string = 'mp4'): string {
  return `webinars/originals/${webinarId}/original.${extension}`
}

/**
 * Generate key for webinar processed HLS files
 */
export function getWebinarProcessedPath(webinarId: string): string {
  return `webinars/processed/${webinarId}`
}

/**
 * Get the public URL for a key
 */
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

/**
 * Delete an object from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Delete all objects with a given prefix (e.g., delete all files in a folder)
 */
export async function deleteR2Folder(prefix: string): Promise<void> {
  // List all objects with the prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  })

  const response = await s3Client.send(listCommand)

  if (!response.Contents || response.Contents.length === 0) {
    return
  }

  // Delete each object
  for (const object of response.Contents) {
    if (object.Key) {
      await deleteFromR2(object.Key)
    }
  }
}
