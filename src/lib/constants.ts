/**
 * Application Constants
 *
 * Centralized configuration values used throughout the application
 */

// Timezone configuration
export const DEFAULT_TIMEZONE = 'Asia/Tbilisi'

// Campaign configuration
export const CAMPAIGN_BATCH_SIZE = 500
export const CAMPAIGN_RATE_LIMIT_PER_SECOND = 10

// Cache TTLs (in milliseconds)
export const EMAIL_CLIENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
export const SETTINGS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// File upload limits
export const MAX_VIDEO_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Video processing
export const VIDEO_POLLING_INTERVAL = 5000 // 5 seconds
export const VIDEO_POLLING_MAX_ATTEMPTS = 360 // 30 minutes total

// UI timeouts
export const COPY_FEEDBACK_TIMEOUT = 2000 // 2 seconds
export const AUTO_SAVE_DEBOUNCE = 2000 // 2 seconds

// Default colors
export const DEFAULT_TAG_COLOR = '#8B5CF6'
export const DEFAULT_PRIMARY_COLOR = '#8B5CF6'

// Webinar interaction types
export const WEBINAR_INTERACTION_TYPES = [
  'POLL',
  'CTA',
  'QUIZ',
  'FEEDBACK',
  'QUESTION',
  'TIP',
  'SPECIAL_OFFER',
  'DOWNLOAD',
] as const

export type WebinarInteractionType = typeof WEBINAR_INTERACTION_TYPES[number]

// Webinar interaction positions
export const WEBINAR_INTERACTION_POSITIONS = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
  'center',
  'full-width-bottom',
] as const

export type WebinarInteractionPosition = typeof WEBINAR_INTERACTION_POSITIONS[number]

// Webinar statuses
export const WEBINAR_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'] as const
export type WebinarStatus = typeof WEBINAR_STATUSES[number]

// Campaign statuses
export const CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'PAUSED'] as const
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

// Automation rule triggers
export const AUTOMATION_TRIGGERS = [
  'REGISTRATION',
  'ATTENDANCE',
  'COMPLETION',
  'NO_SHOW',
] as const
export type AutomationTrigger = typeof AUTOMATION_TRIGGERS[number]
