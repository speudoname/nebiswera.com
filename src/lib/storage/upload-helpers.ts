// Client-side upload helpers for R2 (server-side upload)

/**
 * Upload a file to R2 via server API
 */
export async function uploadFileToR2(
  file: File | Blob,
  type: 'audio' | 'video' | 'image'
): Promise<string> {
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
