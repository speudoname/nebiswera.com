/**
 * Bunny Storage Upload Utility
 * Handles image uploads to Bunny CDN Storage
 */

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME!
const BUNNY_STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!
const BUNNY_STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME!
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL!

/**
 * Upload a file to Bunny Storage
 * @param file - The file to upload (Buffer or Blob)
 * @param path - Path in storage (e.g., 'testimonials/profile-photos/abc123.jpg')
 * @returns The public CDN URL of the uploaded file
 */
export async function uploadToBunnyStorage(
  file: Buffer | Blob,
  path: string
): Promise<string> {
  // Ensure path doesn't start with /
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${cleanPath}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
      'Content-Type': getContentType(cleanPath),
    },
    body: file as BodyInit,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to Bunny Storage: ${error}`)
  }

  // Return the public CDN URL
  return `${BUNNY_CDN_URL}/${cleanPath}`
}

/**
 * Delete a file from Bunny Storage
 * @param path - Path in storage (e.g., 'testimonials/profile-photos/abc123.jpg')
 */
export async function deleteFromBunnyStorage(path: string): Promise<void> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${cleanPath}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
    },
  })

  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(`Failed to delete from Bunny Storage: ${error}`)
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
  }
  return types[ext || ''] || 'application/octet-stream'
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalFilename.split('.').pop()
  return `${timestamp}-${random}.${ext}`
}

/**
 * Generate unique filename for email images
 */
export function generateEmailImageKey(filename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `email-images/${timestamp}-${random}-${sanitized}`
}

/**
 * Generate unique filename for webinar media (images and videos)
 */
export function generateWebinarMediaKey(filename: string, type: 'images' | 'videos' = 'images'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `webinar-media/${type}/${timestamp}-${random}-${sanitized}`
}

/**
 * List files from Bunny Storage folder
 * @param folder - Folder path (e.g., 'email-images/')
 * @returns Array of file objects with url, name, path
 */
export async function listFromBunnyStorage(folder: string): Promise<Array<{
  path: string
  url: string
  name: string
}>> {
  const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder
  const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${cleanFolder}/`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list from Bunny Storage: ${error}`)
  }

  const items = await response.json() as Array<{
    ObjectName: string
    IsDirectory: boolean
    Length: number
    LastChanged: string
  }>

  // Filter out directories and return files only
  return items
    .filter(item => !item.IsDirectory && item.Length > 0)
    .map(item => ({
      path: `${cleanFolder}/${item.ObjectName}`,
      url: `${BUNNY_CDN_URL}/${cleanFolder}/${item.ObjectName}`,
      name: item.ObjectName,
      size: item.Length,
      lastModified: item.LastChanged,
    }))
    .sort((a, b) => {
      // Sort by lastModified descending (newest first)
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    })
}
