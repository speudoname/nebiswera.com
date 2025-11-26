// Cloudflare Stream API utilities
// Docs: https://developers.cloudflare.com/stream/

const CLOUDFLARE_ACCOUNT_ID = process.env.R2_ACCOUNT_ID // Same account ID as R2
// Prefer scoped API Token over Global API Key (better security)
const CLOUDFLARE_STREAM_TOKEN = process.env.CLOUDFLARE_STREAM_TOKEN
// Fallback to Global API Key (not recommended but works)
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL

const STREAM_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`

interface CloudflareApiResponse<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: string[]
  result: T
}

interface StreamVideo {
  uid: string
  thumbnail: string
  thumbnailTimestampPct: number
  readyToStream: boolean
  status: {
    state: 'queued' | 'inprogress' | 'ready' | 'error'
    pctComplete?: number
    errorReasonCode?: string
    errorReasonText?: string
  }
  meta: Record<string, string>
  created: string
  modified: string
  duration: number
  size: number
  input: {
    width: number
    height: number
  }
  playback: {
    hls: string
    dash: string
  }
  preview: string
}

interface TusUploadResponse {
  uploadURL: string
}

function getAuthHeaders(): HeadersInit {
  // Prefer scoped API Token (recommended for security)
  if (CLOUDFLARE_STREAM_TOKEN) {
    return {
      'Authorization': `Bearer ${CLOUDFLARE_STREAM_TOKEN}`,
      'Content-Type': 'application/json',
    }
  }

  // Fallback to Global API Key (works but gives full account access)
  if (CLOUDFLARE_API_KEY && CLOUDFLARE_EMAIL) {
    return {
      'X-Auth-Email': CLOUDFLARE_EMAIL,
      'X-Auth-Key': CLOUDFLARE_API_KEY,
      'Content-Type': 'application/json',
    }
  }

  throw new Error(
    'Missing Cloudflare credentials. Set CLOUDFLARE_STREAM_TOKEN (recommended) or CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL'
  )
}

/**
 * Create a TUS upload URL for direct browser upload
 * This allows large file uploads directly from browser to Cloudflare
 */
export async function createDirectUploadUrl(options: {
  maxDurationSeconds?: number
  expiry?: string // ISO date string
  meta?: Record<string, string>
  requireSignedURLs?: boolean
}): Promise<{ uploadURL: string; uid: string }> {
  const {
    maxDurationSeconds = 3600 * 2, // 2 hours max
    meta = {},
    requireSignedURLs = false,
  } = options

  // Calculate expiry (default 1 hour from now)
  const expiry = options.expiry || new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const response = await fetch(`${STREAM_API_BASE}/direct_upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      maxDurationSeconds,
      expiry,
      meta,
      requireSignedURLs,
    }),
  })

  const data: CloudflareApiResponse<{ uploadURL: string; uid: string }> = await response.json()

  if (!data.success) {
    throw new Error(`Failed to create upload URL: ${data.errors.map(e => e.message).join(', ')}`)
  }

  return data.result
}

/**
 * Get video details by UID
 */
export async function getVideo(videoUid: string): Promise<StreamVideo | null> {
  const response = await fetch(`${STREAM_API_BASE}/${videoUid}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data: CloudflareApiResponse<StreamVideo> = await response.json()

  if (!data.success) {
    if (data.errors.some(e => e.code === 10005)) {
      return null // Video not found
    }
    throw new Error(`Failed to get video: ${data.errors.map(e => e.message).join(', ')}`)
  }

  return data.result
}

/**
 * Delete a video
 */
export async function deleteVideo(videoUid: string): Promise<void> {
  const response = await fetch(`${STREAM_API_BASE}/${videoUid}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  const data: CloudflareApiResponse<null> = await response.json()

  if (!data.success && !data.errors.some(e => e.code === 10005)) {
    throw new Error(`Failed to delete video: ${data.errors.map(e => e.message).join(', ')}`)
  }
}

/**
 * List all videos
 */
export async function listVideos(options?: {
  search?: string
  limit?: number
  after?: string
}): Promise<{ videos: StreamVideo[]; total: number }> {
  const params = new URLSearchParams()
  if (options?.search) params.set('search', options.search)
  if (options?.limit) params.set('limit', options.limit.toString())
  if (options?.after) params.set('after', options.after)

  const response = await fetch(`${STREAM_API_BASE}?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data: CloudflareApiResponse<StreamVideo[]> & { total: number } = await response.json()

  if (!data.success) {
    throw new Error(`Failed to list videos: ${data.errors.map(e => e.message).join(', ')}`)
  }

  return {
    videos: data.result,
    total: data.total || data.result.length,
  }
}

/**
 * Generate iframe embed URL
 */
export function getEmbedUrl(videoUid: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoUid}/iframe`
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(videoUid: string, options?: {
  time?: string // Time in video (e.g., "1s", "10s", "1m30s")
  height?: number
  width?: number
  fit?: 'crop' | 'clip' | 'scale'
}): string {
  const params = new URLSearchParams()
  if (options?.time) params.set('time', options.time)
  if (options?.height) params.set('height', options.height.toString())
  if (options?.width) params.set('width', options.width.toString())
  if (options?.fit) params.set('fit', options.fit)

  const baseUrl = `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoUid}/thumbnails/thumbnail.jpg`
  return params.toString() ? `${baseUrl}?${params}` : baseUrl
}

/**
 * Get HLS playback URL
 */
export function getHlsUrl(videoUid: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoUid}/manifest/video.m3u8`
}

/**
 * Update video metadata
 */
export async function updateVideoMeta(
  videoUid: string,
  meta: Record<string, string>
): Promise<StreamVideo> {
  const response = await fetch(`${STREAM_API_BASE}/${videoUid}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ meta }),
  })

  const data: CloudflareApiResponse<StreamVideo> = await response.json()

  if (!data.success) {
    throw new Error(`Failed to update video: ${data.errors.map(e => e.message).join(', ')}`)
  }

  return data.result
}

/**
 * Poll for video processing status
 * Returns when video is ready or throws on error
 */
export async function waitForVideoReady(
  videoUid: string,
  options?: {
    maxWaitMs?: number
    pollIntervalMs?: number
    onProgress?: (pct: number) => void
  }
): Promise<StreamVideo> {
  const maxWait = options?.maxWaitMs || 10 * 60 * 1000 // 10 minutes default
  const pollInterval = options?.pollIntervalMs || 5000 // 5 seconds
  const startTime = Date.now()

  while (Date.now() - startTime < maxWait) {
    const video = await getVideo(videoUid)

    if (!video) {
      throw new Error('Video not found')
    }

    if (video.status.state === 'ready') {
      return video
    }

    if (video.status.state === 'error') {
      throw new Error(`Video processing failed: ${video.status.errorReasonText}`)
    }

    if (video.status.pctComplete && options?.onProgress) {
      options.onProgress(video.status.pctComplete)
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('Video processing timed out')
}
