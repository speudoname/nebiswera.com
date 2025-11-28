// Client-side upload helpers

/**
 * Upload a video to Bunny Stream via server API
 * Returns object with hlsUrl and thumbnailUrl
 */
export async function uploadVideoToBunny(
  file: File | Blob,
  title?: string
): Promise<{ videoId: string; hlsUrl: string; thumbnailUrl: string }> {
  const formData = new FormData()

  const filename = file instanceof File ? file.name : `video.${getExtension(file.type)}`
  const fileToUpload = file instanceof File ? file : new File([file], filename, { type: file.type })

  formData.append('file', fileToUpload)
  if (title) {
    formData.append('title', title)
  }

  const response = await fetch('/api/upload/video', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Video upload failed')
  }

  const { videoId, hlsUrl, thumbnailUrl } = await response.json()
  return { videoId, hlsUrl, thumbnailUrl }
}

/**
 * Upload a file to R2 via server API (for images and audio only)
 */
export async function uploadFileToR2(
  file: File | Blob,
  type: 'audio' | 'video' | 'image'
): Promise<string> {
  // For videos, redirect to Bunny upload and return HLS URL
  if (type === 'video') {
    const result = await uploadVideoToBunny(file)
    return result.hlsUrl
  }

  // Create FormData with file and type
  const formData = new FormData()

  // Convert Blob to File if needed (for proper filename)
  const filename = file instanceof File ? file.name : `${type}.${getExtension(file.type)}`
  const fileToUpload = file instanceof File ? file : new File([file], filename, { type: file.type })

  formData.append('file', fileToUpload)
  formData.append('type', type)

  // Upload via server API
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const { url } = await response.json()
  return url
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
  }
  return map[mimeType] || 'bin'
}
