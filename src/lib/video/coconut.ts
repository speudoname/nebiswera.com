// Coconut Video Transcoding API Integration
// https://docs.coconut.co/

const COCONUT_API_KEY = process.env.COCONUT_API_KEY
const COCONUT_API_URL = 'https://api.coconut.co/v2/jobs'

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

// Get the webhook URL from environment or construct from NEXTAUTH_URL
function getWebhookUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://nebiswera.com'
  return `${baseUrl}/api/webhooks/coconut`
}

export interface CoconutJobConfig {
  webinarId: string
  inputUrl: string // R2 public URL of the original video
}

export interface CoconutJobResponse {
  id: string
  status: string
  progress: number
  created_at: string
  completed_at?: string
  input?: {
    status: string
    metadata?: {
      duration?: number
      width?: number
      height?: number
    }
  }
  outputs?: Record<string, {
    status: string
    urls?: string[]
  }>
}

/**
 * Create a transcoding job with Coconut
 * - Outputs: HLS with 480p, 720p, 1080p + thumbnail
 * - Storage: Cloudflare R2 (S3-compatible)
 */
export async function createTranscodingJob(config: CoconutJobConfig): Promise<CoconutJobResponse> {
  if (!COCONUT_API_KEY) {
    throw new Error('COCONUT_API_KEY is not configured')
  }

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials are not configured')
  }

  const outputPath = `webinars/processed/${config.webinarId}`

  const jobConfig = {
    input: {
      url: config.inputUrl,
    },
    storage: {
      service: 's3other',
      bucket: R2_BUCKET_NAME,
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        access_key_id: R2_ACCESS_KEY_ID,
        secret_access_key: R2_SECRET_ACCESS_KEY,
      },
    },
    notification: {
      type: 'http',
      url: getWebhookUrl(),
      metadata: {
        webinarId: config.webinarId,
      },
    },
    outputs: {
      // Thumbnail for preview
      'jpg:300x': {
        path: `/${outputPath}/thumbnail.jpg`,
        number: 1,
        offset: '10%', // Take thumbnail at 10% of video duration
      },
      // HLS adaptive streaming with multiple qualities
      // Variants are strings in format: "container:resolution::options"
      'httpstream': {
        hls: {
          path: `/${outputPath}/hls`,
        },
        variants: [
          'mp4:480p::quality=3,maxrate=1000k',  // SD
          'mp4:720p::quality=4,maxrate=2500k',  // HD
          'mp4:1080p::quality=4,maxrate=5000k', // Full HD
        ],
      },
    },
    settings: {
      ultrafast: true, // Enable faster parallel transcoding
    },
  }

  const response = await fetch(COCONUT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(COCONUT_API_KEY + ':').toString('base64')}`,
    },
    body: JSON.stringify(jobConfig),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Coconut API error:', errorText)
    throw new Error(`Coconut API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result as CoconutJobResponse
}

/**
 * Get job status from Coconut
 */
export async function getJobStatus(jobId: string): Promise<CoconutJobResponse> {
  if (!COCONUT_API_KEY) {
    throw new Error('COCONUT_API_KEY is not configured')
  }

  const response = await fetch(`${COCONUT_API_URL}/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(COCONUT_API_KEY + ':').toString('base64')}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Coconut API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Get the public HLS URL for a webinar
 */
export function getHlsUrl(webinarId: string): string {
  return `${R2_PUBLIC_URL}/webinars/processed/${webinarId}/hls/master.m3u8`
}

/**
 * Get the public thumbnail URL for a webinar
 */
export function getThumbnailUrl(webinarId: string): string {
  return `${R2_PUBLIC_URL}/webinars/processed/${webinarId}/thumbnail.jpg`
}
