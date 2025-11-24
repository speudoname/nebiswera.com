// Cloudflare R2 Storage utilities
// S3-compatible storage for testimonial media

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // e.g., https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const PUBLIC_URL = process.env.R2_PUBLIC_URL // e.g., https://cdn.nebiswera.com

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  file: Buffer | Blob,
  key: string, // e.g., "testimonials/{id}/profile.jpg"
  contentType: string
): Promise<string> {
  const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  // Return public URL
  return `${PUBLIC_URL}/${key}`
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}

/**
 * Get a signed URL for temporary access (for private files)
 */
export async function getSignedR2Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * Generate a unique key for testimonial media
 */
export function generateTestimonialKey(testimonialId: string, filename: string): string {
  return `testimonials/${testimonialId}/${filename}`
}
