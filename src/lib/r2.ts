// Cloudflare R2 Storage utilities
// Direct R2 API calls using native fetch (no SDK needed)

import crypto from 'crypto'
import https from 'https'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Create HTTPS agent with proper TLS configuration for R2
const httpsAgent = new https.Agent({
  keepAlive: true,
  // Set minimum TLS version to 1.2 (Cloudflare R2 requirement)
  minVersion: 'TLSv1.2',
  // Allow legacy renegotiation for compatibility
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
})

/**
 * Generate AWS Signature V4 for authentication
 */
function generateAwsSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: Buffer,
  region = 'auto'
) {
  const service = 's3'
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8)
  const dateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')

  // Create canonical request
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex')
  const urlObj = new URL(url)
  const canonicalUri = urlObj.pathname
  const canonicalQueryString = ''
  const canonicalHeaders = `host:${urlObj.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateTime}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${date}/${region}/${service}/aws4_request`
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  const stringToSign = `${algorithm}\n${dateTime}\n${credentialScope}\n${canonicalRequestHash}`

  // Calculate signature
  const kDate = crypto.createHmac('sha256', `AWS4${R2_SECRET_ACCESS_KEY}`).update(date).digest()
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest()
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest()
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest()
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  // Return authorization header
  return `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

/**
 * Upload a file to R2 using direct HTTP API
 */
export async function uploadToR2(
  file: Buffer | Blob,
  key: string,
  contentType: string
): Promise<string> {
  const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file
  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`
  const dateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex')

  const headers: Record<string, string> = {
    'Host': `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    'Content-Type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': dateTime,
  }

  headers['Authorization'] = generateAwsSignature('PUT', url, headers, buffer)

  // Use native https.request with custom agent for proper TLS handling
  return new Promise<string>((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Length': buffer.length,
      },
      agent: httpsAgent,
    }

    const req = https.request(options, (res) => {
      let responseBody = ''

      res.on('data', (chunk) => {
        responseBody += chunk
      })

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          // Return public URL
          resolve(`${PUBLIC_URL}/${key}`)
        } else {
          reject(new Error(`R2 upload failed: ${res.statusCode} ${responseBody}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`R2 upload request failed: ${error.message}`))
    })

    req.write(buffer)
    req.end()
  })
}

/**
 * Generate a unique key for testimonial media
 */
export function generateTestimonialKey(testimonialId: string, filename: string): string {
  return `testimonials/${testimonialId}/${filename}`
}
