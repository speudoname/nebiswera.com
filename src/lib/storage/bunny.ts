/**
 * Bunny Stream Video Service
 * Handles video uploads, streaming, and management via Bunny.net
 */

import { logger } from '@/lib'

// Library-specific credentials (secure - no access to full Bunny account)
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!
const BUNNY_LIBRARY_API_KEY = process.env.BUNNY_LIBRARY_API_KEY!
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME!

export interface BunnyVideo {
  guid: string
  title: string
  status: number // 0=created, 1=uploading, 2=processing, 3=transcoding, 4=finished, 5=error, 6=upload_failed
  length: number // Duration in seconds
  thumbnailFileName: string
  dateUploaded: string
  encodeProgress: number
  views?: number
  storageSize?: number
  captions?: { srclang: string; label: string }[]
  hasMP4Fallback?: boolean
  collectionId?: string
  category?: string
}

interface CreateVideoResponse {
  videoId: string
  uploadUrl: string
}

/**
 * Create a new video entry in Bunny Stream
 * Returns videoId and direct upload URL
 */
export async function createBunnyVideo(title: string): Promise<CreateVideoResponse> {
  logger.info('[Bunny] Creating video entry with title:', title)
  logger.debug('[Bunny] Library ID:', BUNNY_LIBRARY_ID)
  logger.debug('[Bunny] API Key present:', !!BUNNY_LIBRARY_API_KEY)

  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_LIBRARY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  )

  logger.debug('[Bunny] Create video response status:', response.status)

  if (!response.ok) {
    const error = await response.text()
    logger.error('[Bunny] Failed to create video:', error)
    throw new Error(`Failed to create Bunny video: ${error}`)
  }

  const data = await response.json()
  logger.info('[Bunny] Video created with GUID:', data.guid)

  return {
    videoId: data.guid,
    uploadUrl: `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${data.guid}`,
  }
}

/**
 * Upload video buffer directly to Bunny Stream
 */
export async function uploadVideoToBunny(
  videoId: string,
  videoBuffer: Buffer,
  contentType: string = 'video/mp4'
): Promise<void> {
  logger.info('[Bunny] Uploading video buffer to videoId:', videoId)
  logger.debug('[Bunny] Buffer size:', videoBuffer.length, 'bytes')
  logger.debug('[Bunny] Content type:', contentType)

  const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`
  logger.debug('[Bunny] Upload URL:', uploadUrl)

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_LIBRARY_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(videoBuffer),
  })

  logger.debug('[Bunny] Upload response status:', response.status)

  if (!response.ok) {
    const error = await response.text()
    logger.error('[Bunny] Failed to upload video:', error)
    throw new Error(`Failed to upload video to Bunny: ${error}`)
  }

  logger.info('[Bunny] Video upload complete!')
}

/**
 * Upload video from URL (fetch from external URL and upload to Bunny)
 */
export async function uploadVideoFromUrl(
  videoId: string,
  sourceUrl: string
): Promise<void> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/fetch`,
    {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_LIBRARY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: sourceUrl }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch video to Bunny: ${error}`)
  }
}

/**
 * List all videos from Bunny Stream library
 */
export async function listBunnyVideos(
  page: number = 1,
  itemsPerPage: number = 100
): Promise<{
  videos: BunnyVideo[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
}> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`,
    {
      headers: {
        'AccessKey': BUNNY_LIBRARY_API_KEY,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list Bunny videos: ${error}`)
  }

  const data = await response.json()
  return {
    videos: data.items || [],
    totalItems: data.totalItems || 0,
    currentPage: data.currentPage || page,
    itemsPerPage: data.itemsPerPage || itemsPerPage,
  }
}

/**
 * Get video statistics from Bunny Stream
 */
export async function getBunnyVideoStats(videoId: string): Promise<{
  views: number
  watchTime: number
  averageWatchTime: number
}> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/heatmap`,
    {
      headers: {
        'AccessKey': BUNNY_LIBRARY_API_KEY,
      },
    }
  )

  if (!response.ok) {
    // Stats may not be available for all videos
    return { views: 0, watchTime: 0, averageWatchTime: 0 }
  }

  const data = await response.json()
  return {
    views: data.viewCount || 0,
    watchTime: data.watchTime || 0,
    averageWatchTime: data.averageWatchTime || 0,
  }
}

/**
 * Get video details from Bunny Stream
 */
export async function getBunnyVideo(videoId: string): Promise<BunnyVideo> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      headers: {
        'AccessKey': BUNNY_LIBRARY_API_KEY,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Bunny video: ${error}`)
  }

  return response.json()
}

/**
 * Delete a video from Bunny Stream
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_LIBRARY_API_KEY,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete Bunny video: ${error}`)
  }
}

/**
 * Get the HLS streaming URL for a video
 */
export function getBunnyHlsUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`
}

/**
 * Get the direct MP4 URL for a video (fallback)
 */
export function getBunnyMp4Url(videoId: string, quality: '240' | '360' | '480' | '720' | '1080' = '720'): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/play_${quality}p.mp4`
}

/**
 * Get the thumbnail URL for a video
 */
export function getBunnyThumbnailUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`
}

/**
 * Get video embed URL (for iframe embedding)
 */
export function getBunnyEmbedUrl(videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`
}

/**
 * Check if video is ready for playback
 * Status 4 = finished (ready to play)
 */
export function isVideoReady(video: BunnyVideo): boolean {
  return video.status === 4
}

/**
 * Check if video is still processing
 */
export function isVideoProcessing(video: BunnyVideo): boolean {
  return video.status >= 1 && video.status <= 3
}

/**
 * Check if video has an error
 */
export function hasVideoError(video: BunnyVideo): boolean {
  return video.status === 5 || video.status === 6
}

/**
 * Get human-readable video status
 */
export function getVideoStatusText(status: number): string {
  const statuses: Record<number, string> = {
    0: 'created',
    1: 'uploading',
    2: 'processing',
    3: 'transcoding',
    4: 'ready',
    5: 'error',
    6: 'upload_failed',
  }
  return statuses[status] || 'unknown'
}

/**
 * Full upload flow: create video entry and upload buffer
 * Returns all URLs needed for playback
 */
export async function uploadVideo(
  title: string,
  videoBuffer: Buffer,
  contentType: string = 'video/mp4'
): Promise<{
  videoId: string
  hlsUrl: string
  thumbnailUrl: string
  embedUrl: string
}> {
  // Create video entry
  const { videoId } = await createBunnyVideo(title)

  // Upload the video
  await uploadVideoToBunny(videoId, videoBuffer, contentType)

  return {
    videoId,
    hlsUrl: getBunnyHlsUrl(videoId),
    thumbnailUrl: getBunnyThumbnailUrl(videoId),
    embedUrl: getBunnyEmbedUrl(videoId),
  }
}

/**
 * Upload video from existing URL
 * Bunny will fetch and process the video
 */
export async function uploadVideoByUrl(
  title: string,
  sourceUrl: string
): Promise<{
  videoId: string
  hlsUrl: string
  thumbnailUrl: string
  embedUrl: string
}> {
  // Create video entry
  const { videoId } = await createBunnyVideo(title)

  // Tell Bunny to fetch the video from URL
  await uploadVideoFromUrl(videoId, sourceUrl)

  return {
    videoId,
    hlsUrl: getBunnyHlsUrl(videoId),
    thumbnailUrl: getBunnyThumbnailUrl(videoId),
    embedUrl: getBunnyEmbedUrl(videoId),
  }
}
