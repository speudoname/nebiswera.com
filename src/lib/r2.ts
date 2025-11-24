// Cloudflare R2 Storage utilities using presigned URLs
import crypto from 'crypto'

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

/**
 * Generate AWS Signature V4 for presigned URL
 */
function generatePresignedUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): string {
  const region = 'auto'
  const service = 's3'
  const algorithm = 'AWS4-HMAC-SHA256'

  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  // Use custom domain for CORS compatibility
  const customDomain = PUBLIC_URL.replace('https://', '')
  const host = customDomain
  const canonicalUri = `/${key}`

  // Canonical query string
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${R2_ACCESS_KEY_ID}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
  })

  if (contentType) {
    queryParams.set('Content-Type', contentType)
  }

  const canonicalQueryString = queryParams.toString()

  // Canonical request
  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = 'host'
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  // String to sign
  const canonicalRequestHash = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex')

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n')

  // Calculate signature
  const kDate = crypto
    .createHmac('sha256', `AWS4${R2_SECRET_ACCESS_KEY}`)
    .update(dateStamp)
    .digest()
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest()
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest()
  const kSigning = crypto
    .createHmac('sha256', kService)
    .update('aws4_request')
    .digest()
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign)
    .digest('hex')

  // Build presigned URL
  queryParams.set('X-Amz-Signature', signature)

  return `https://${host}${canonicalUri}?${queryParams.toString()}`
}

/**
 * Generate presigned URL for uploading to R2
 */
export function generateUploadUrl(
  key: string,
  contentType: string
): { uploadUrl: string; publicUrl: string } {
  const uploadUrl = generatePresignedUrl(key, contentType, 3600)
  const publicUrl = `${PUBLIC_URL}/${key}`

  return { uploadUrl, publicUrl }
}

/**
 * Generate a unique key for testimonial media
 */
export function generateTestimonialKey(testimonialId: string, filename: string): string {
  return `testimonials/${testimonialId}/${filename}`
}
