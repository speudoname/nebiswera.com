/**
 * Storage Module Index
 *
 * This module provides two storage services:
 *
 * 1. File Storage (./files.ts) - For images, documents, and other static files
 *    Uses Bunny CDN Storage
 *
 * 2. Video Streaming (./bunny.ts) - For video uploads and HLS streaming
 *    Uses Bunny Stream API
 *
 * 3. Upload Helpers (./upload-helpers.ts) - Client-side upload utilities
 */

// File storage (images, documents, PDFs, etc.)
export {
  uploadToBunnyStorage,
  deleteFromBunnyStorage,
  listFromBunnyStorage,
  listFromBunnyStorageRecursive,
  listAllBunnyContent,
  generateUniqueFilename,
  generateEmailImageKey,
  generateWebinarMediaKey,
  generateUserProfileKey,
  generateBlogImageKey,
  generateLmsContentKey,
  generateLmsCourseThumbnailKey,
  generateLmsCertificateKey,
  type LmsMediaType,
} from './files'

// Video streaming (Bunny Stream)
export {
  createBunnyVideo,
  getBunnyVideo,
  deleteBunnyVideo,
  listBunnyVideos,
  getBunnyVideoStats,
  uploadVideo,
  uploadVideoByUrl,
  uploadVideoToBunny,
  uploadVideoFromUrl,
  getBunnyHlsUrl,
  getBunnyMp4Url,
  getBunnyThumbnailUrl,
  getBunnyEmbedUrl,
  isVideoReady,
  isVideoProcessing,
  hasVideoError,
  getVideoStatusText,
  type BunnyVideo,
} from './bunny'

// Upload helpers (client-side utilities)
export {
  uploadVideoToBunny as uploadVideoClient,
  uploadFileToR2,
} from './upload-helpers'
