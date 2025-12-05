/**
 * Shared file validation utilities for upload endpoints
 * Centralizes file type validation, size limits, and error messages
 */

import { NextResponse } from 'next/server'

// File size limits per type (in bytes)
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,    // 10MB
  audio: 50 * 1024 * 1024,    // 50MB
  video: 100 * 1024 * 1024,   // 100MB
  videoStream: 500 * 1024 * 1024, // 500MB for Bunny Stream
  document: 25 * 1024 * 1024, // 25MB for PDFs, docs
} as const

// Allowed MIME types per upload type
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'],
  video: ['video/webm', 'video/mp4', 'video/quicktime'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const

export type FileType = keyof typeof ALLOWED_MIME_TYPES

export interface FileValidationResult {
  valid: boolean
  error?: string
  file?: Blob & { name: string; size: number; type: string }
}

/**
 * Validate a file from FormData
 * Returns the validated file or an error message
 */
export function validateUploadFile(
  formDataFile: FormDataEntryValue | null,
  fileType: FileType,
  options?: {
    maxSize?: number // Override default max size
    allowedTypes?: string[] // Override default allowed types
    fieldName?: string // Name for error messages (default: "file")
  }
): FileValidationResult {
  const fieldName = options?.fieldName || 'file'

  // Check file exists
  if (!formDataFile || typeof formDataFile === 'string') {
    return { valid: false, error: `Invalid or missing ${fieldName}` }
  }

  // Type assertion for FormData file
  if (!('size' in formDataFile) || !('type' in formDataFile)) {
    return { valid: false, error: `Invalid ${fieldName} format` }
  }

  const file = formDataFile as Blob & { name: string; size: number; type: string }

  // Validate file size
  const maxSize = options?.maxSize || MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.image
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024)
    return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` }
  }

  // Validate MIME type
  const allowedTypes = options?.allowedTypes || ALLOWED_MIME_TYPES[fileType]
  if (!allowedTypes.includes(file.type as never)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true, file }
}

/**
 * Helper to create error response for invalid files
 */
export function fileValidationError(error: string, status: 400 | 413 = 400): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * Get file extension from filename or MIME type
 */
export function getFileExtension(filename: string, mimeType?: string): string {
  // Try filename first
  const fromFilename = filename.split('.').pop()?.toLowerCase()
  if (fromFilename && fromFilename.length <= 5) {
    return fromFilename
  }

  // Fallback to MIME type mapping
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
  }

  return mimeType ? (mimeToExt[mimeType] || 'bin') : 'bin'
}

/**
 * Check if a file type is an image
 */
export function isImageType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.image.includes(mimeType as typeof ALLOWED_MIME_TYPES.image[number])
}

/**
 * Check if a file type is a video
 */
export function isVideoType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.video.includes(mimeType as typeof ALLOWED_MIME_TYPES.video[number])
}

/**
 * Check if a file type is audio
 */
export function isAudioType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.audio.includes(mimeType as typeof ALLOWED_MIME_TYPES.audio[number])
}
