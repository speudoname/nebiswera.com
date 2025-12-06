/**
 * Bunny Storage File Service
 * Handles file/image uploads to Bunny CDN Storage
 *
 * Note: For video streaming, use ./bunny.ts (Bunny Stream API)
 */

import { logger } from '@/lib/logger'

// Environment variables with runtime validation
interface StorageConfig {
  zone: string
  password: string
  hostname: string
  cdnUrl: string
}

function getStorageConfig(): StorageConfig {
  const zone = process.env.BUNNY_STORAGE_ZONE_NAME
  const password = process.env.BUNNY_STORAGE_PASSWORD
  const hostname = process.env.BUNNY_STORAGE_HOSTNAME
  const cdnUrl = process.env.BUNNY_CDN_URL

  if (!zone || !password || !hostname || !cdnUrl) {
    const missing: string[] = []
    if (!zone) missing.push('BUNNY_STORAGE_ZONE_NAME')
    if (!password) missing.push('BUNNY_STORAGE_PASSWORD')
    if (!hostname) missing.push('BUNNY_STORAGE_HOSTNAME')
    if (!cdnUrl) missing.push('BUNNY_CDN_URL')
    throw new Error(`Missing required Bunny Storage env vars: ${missing.join(', ')}`)
  }

  return { zone, password, hostname, cdnUrl }
}

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
  const config = getStorageConfig()

  // Ensure path doesn't start with /
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  const url = `https://${config.hostname}/${config.zone}/${cleanPath}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: config.password,
      'Content-Type': getContentType(cleanPath),
    },
    body: file as BodyInit,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to Bunny Storage: ${error}`)
  }

  // Return the public CDN URL
  return `${config.cdnUrl}/${cleanPath}`
}

/**
 * Delete a file from Bunny Storage
 * @param path - Path in storage (e.g., 'testimonials/profile-photos/abc123.jpg')
 */
export async function deleteFromBunnyStorage(path: string): Promise<void> {
  const config = getStorageConfig()

  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const url = `https://${config.hostname}/${config.zone}/${cleanPath}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      AccessKey: config.password,
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
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    // Text
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
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
 * Generate unique filename for user profile images
 */
export function generateUserProfileKey(userId: string, filename: string): string {
  const timestamp = Date.now()
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  return `user-profiles/${userId}-${timestamp}.${ext}`
}

/**
 * Generate unique filename for blog post images
 */
export function generateBlogImageKey(filename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `blog-images/${timestamp}-${random}-${sanitized}`
}

// ===========================================
// LMS Storage Keys
// ===========================================

export type LmsMediaType = 'videos' | 'images' | 'audio' | 'files' | 'thumbnails'

/**
 * Generate unique filename for LMS course content
 * @param courseId - The course ID
 * @param mediaType - Type of media (videos, images, audio, files, thumbnails)
 * @param filename - Original filename
 */
export function generateLmsContentKey(
  courseId: string,
  mediaType: LmsMediaType,
  filename: string
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `lms/courses/${courseId}/${mediaType}/${timestamp}-${random}-${sanitized}`
}

/**
 * Generate unique filename for LMS course thumbnail
 */
export function generateLmsCourseThumbnailKey(courseId: string, filename: string): string {
  const timestamp = Date.now()
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  return `lms/courses/${courseId}/thumbnail-${timestamp}.${ext}`
}

/**
 * Generate unique filename for LMS certificate PDF
 */
export function generateLmsCertificateKey(certificateId: string): string {
  return `lms/certificates/${certificateId}.pdf`
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
  size: number
  lastModified: string
}>> {
  const config = getStorageConfig()

  const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder
  const url = `https://${config.hostname}/${config.zone}/${cleanFolder}/`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      AccessKey: config.password,
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
      url: `${config.cdnUrl}/${cleanFolder}/${item.ObjectName}`,
      name: item.ObjectName,
      size: item.Length,
      lastModified: item.LastChanged,
    }))
    .sort((a, b) => {
      // Sort by lastModified descending (newest first)
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    })
}

/**
 * List files from a Bunny Storage folder recursively
 * @param folder - Folder path to start from
 * @returns Array of file objects
 */
export async function listFromBunnyStorageRecursive(folder: string): Promise<Array<{
  path: string
  url: string
  name: string
  size: number
  lastModified: string
  folder: string
}>> {
  const config = getStorageConfig()

  const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder
  const url = `https://${config.hostname}/${config.zone}/${cleanFolder}/`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        AccessKey: config.password,
      },
    })

    if (!response.ok) {
      return []
    }

    const items = await response.json() as Array<{
      ObjectName: string
      IsDirectory: boolean
      Length: number
      LastChanged: string
    }>

    const files: Array<{
      path: string
      url: string
      name: string
      size: number
      lastModified: string
      folder: string
    }> = []

    for (const item of items) {
      if (item.IsDirectory) {
        // Recursively fetch from subdirectories
        const subFiles = await listFromBunnyStorageRecursive(`${cleanFolder}/${item.ObjectName}`)
        files.push(...subFiles)
      } else if (item.Length > 0) {
        files.push({
          path: `${cleanFolder}/${item.ObjectName}`,
          url: `${config.cdnUrl}/${cleanFolder}/${item.ObjectName}`,
          name: item.ObjectName,
          size: item.Length,
          lastModified: item.LastChanged,
          folder: cleanFolder,
        })
      }
    }

    return files
  } catch (error) {
    logger.error(`Failed to list from Bunny Storage folder ${folder}:`, error)
    return []
  }
}

/**
 * List ALL content from Bunny Storage (images and videos from all folders)
 * @returns Object containing arrays of images and videos
 */
export async function listAllBunnyContent(): Promise<{
  images: Array<{
    key: string
    url: string
    name: string
    size: number
    lastModified: string
    source: string
  }>
  videos: Array<{
    key: string
    url: string
    name: string
    size: number
    lastModified: string
    source: string
  }>
}> {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv']

  // Folders to scan for content
  const foldersToScan = [
    { path: 'email-images', source: 'Email' },
    { path: 'blog-images', source: 'Blog' },
    { path: 'webinar-media/images', source: 'Webinar' },
    { path: 'webinar-media/videos', source: 'Webinar' },
    { path: 'lms', source: 'Course' },
    { path: 'testimonials', source: 'Testimonials' },
    { path: 'user-profiles', source: 'User Profiles' },
  ]

  const images: Array<{
    key: string
    url: string
    name: string
    size: number
    lastModified: string
    source: string
  }> = []

  const videos: Array<{
    key: string
    url: string
    name: string
    size: number
    lastModified: string
    source: string
  }> = []

  // Fetch content from all folders in parallel
  const results = await Promise.all(
    foldersToScan.map(async ({ path, source }) => {
      try {
        const files = await listFromBunnyStorageRecursive(path)
        return { files, source }
      } catch (error) {
        logger.error(`Failed to list from ${path}:`, error)
        return { files: [], source }
      }
    })
  )

  // Categorize files into images and videos
  for (const { files, source } of results) {
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const item = {
        key: file.path,
        url: file.url,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        source,
      }

      if (imageExtensions.includes(ext)) {
        images.push(item)
      } else if (videoExtensions.includes(ext)) {
        videos.push(item)
      }
    }
  }

  // Sort by lastModified descending (newest first)
  images.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
  videos.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

  return { images, videos }
}
