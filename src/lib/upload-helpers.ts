// Client-side upload helpers for R2 presigned URLs

/**
 * Upload a file directly to R2 using a presigned URL
 */
export async function uploadFileToR2(
  file: File | Blob,
  type: 'audio' | 'video' | 'image'
): Promise<string> {
  // Step 1: Get presigned URL from server
  const filename = file instanceof File ? file.name : `${type}.${getExtension(file.type)}`

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      contentType: file.type,
      filename,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get upload URL')
  }

  const { uploadUrl, publicUrl } = await response.json()

  // Step 2: Upload file directly to R2
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`)
  }

  // Return the public URL
  return publicUrl
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
