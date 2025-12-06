/**
 * Facebook Pixel Library
 * Main exports for both client and server-side tracking
 */

// Types
export type {
  StandardPixelEvent,
  CustomPixelEvent,
  PixelEventName,
  PageType,
  EventSource,
  EventStatus,
  PixelEventParams,
  UserData,
  HashedUserData,
  TrackEventRequest,
  ConversionsAPIEvent,
  ConversionsAPIRequest,
  ConversionsAPIResponse,
  PixelConfig,
  PixelEventLogEntry,
  ViewContentConfig,
} from './types'

export { DEFAULT_VIEW_CONTENT_CONFIG } from './types'

// Configuration
export {
  getPixelConfig,
  isPixelEnabled,
  isTestMode,
  isServerSideEnabled,
  invalidateConfigCache,
  getClientPixelId,
  updatePixelConfig,
} from './config'

// Utilities
export {
  sha256Hash,
  normalizeAndHash,
  normalizePhone,
  hashUserData,
  generateEventId,
  getUnixTimestamp,
  parseFbpCookie,
  parseFbcCookie,
  extractFbclid,
  getUserDataFieldsSummary,
} from './utils'

// Server-side tracking
export {
  trackServerEvent,
  trackServerEventsBatch,
  cleanupOldEventLogs,
  getEventLogs,
  getEventLogDetails,
} from './server'
