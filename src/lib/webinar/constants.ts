/**
 * Webinar System Constants
 *
 * Centralized configuration for all webinar-related magic numbers.
 * Extracted to improve maintainability and make the system easier to configure.
 */

// ===========================================
// Timing Constants
// ===========================================

export const TIMING = {
  /**
   * How many minutes before session start users can enter early
   * Used in: WebinarRoom.tsx, access-state.ts
   */
  EARLY_ACCESS_MINUTES: 5,

  /**
   * How often to update watch progress (in seconds)
   * Used in: WebinarRoom.tsx
   */
  PROGRESS_UPDATE_INTERVAL_SECONDS: 15,

  /**
   * Maximum random jitter for progress updates (in seconds)
   * Prevents all users from updating at exactly the same time
   * Used in: WebinarRoom.tsx
   */
  PROGRESS_JITTER_MAX_SECONDS: 15,

  /**
   * Default interaction display duration (in seconds)
   * How long an interaction stays visible if not dismissed
   * Used in: InteractionOverlay.tsx
   */
  INTERACTION_DEFAULT_DURATION_SECONDS: 30,

  /**
   * Ably token time-to-live (in milliseconds)
   * How long a chat token is valid before needing refresh
   * Used in: Ably integration
   */
  ABLY_TOKEN_TTL_MS: 2 * 60 * 60 * 1000, // 2 hours
} as const

// ===========================================
// Completion & Engagement Thresholds
// ===========================================

export const THRESHOLDS = {
  /**
   * Minimum watch percentage to mark webinar as "completed"
   * 80% = user watched at least 48 minutes of a 60-minute webinar
   * Used in: WebinarRoom.tsx analytics
   */
  COMPLETION_THRESHOLD_PERCENT: 80,

  /**
   * Maximum session duration to be considered a "bounce"
   * If user leaves within 60 seconds, considered not engaged
   * Used in: Analytics (currently removed, kept for reference)
   */
  BOUNCE_THRESHOLD_SECONDS: 60,

  /**
   * Minimum watch percentage to avoid "early exit" flag
   * If user leaves before watching 90%, considered early exit
   * Used in: Analytics (currently removed, kept for reference)
   */
  EARLY_EXIT_THRESHOLD_PERCENT: 90,
} as const

// ===========================================
// Rate Limit Constants
// ===========================================

export const RATE_LIMITS = {
  /**
   * Maximum registrations per hour per IP
   * Prevents spam registrations
   * Used in: rate-limit.ts
   */
  REGISTRATION_PER_HOUR: 5,

  /**
   * Registration rate limit duration (in seconds)
   * Used in: rate-limit.ts
   */
  REGISTRATION_DURATION_SECONDS: 3600, // 1 hour

  /**
   * Maximum chat messages per minute per user
   * Prevents chat flooding
   * Used in: rate-limit.ts
   */
  CHAT_MESSAGES_PER_MINUTE: 20,

  /**
   * Chat rate limit duration (in seconds)
   * Used in: rate-limit.ts
   */
  CHAT_DURATION_SECONDS: 60, // 1 minute

  /**
   * Chat rate limit block duration when exceeded (in seconds)
   * Block for 5 minutes if user exceeds chat limit
   * Used in: rate-limit.ts
   */
  CHAT_BLOCK_DURATION_SECONDS: 300, // 5 minutes

  /**
   * Maximum analytics events per minute per user
   * Generous limit to allow normal tracking but prevent abuse
   * Used in: rate-limit.ts
   */
  ANALYTICS_EVENTS_PER_MINUTE: 100,

  /**
   * Analytics rate limit duration (in seconds)
   * Used in: rate-limit.ts
   */
  ANALYTICS_DURATION_SECONDS: 60, // 1 minute

  /**
   * Maximum chat message length (in characters)
   * Used in: Chat validation
   */
  CHAT_MESSAGE_MAX_LENGTH: 500,

  /**
   * General API rate limit: requests per minute per IP
   * Used in: rate-limit.ts for general endpoints
   */
  GENERAL_API_PER_MINUTE: 60,

  /**
   * Auth endpoints: requests per minute per IP
   * Used in: rate-limit.ts for auth endpoints
   */
  AUTH_PER_MINUTE: 5,

  /**
   * Email sending: requests per 5 minutes per IP
   * Used in: rate-limit.ts for email endpoints
   */
  EMAIL_PER_5_MINUTES: 3,
  EMAIL_DURATION_SECONDS: 300, // 5 minutes
} as const

// ===========================================
// Chat & Messaging Constants
// ===========================================

export const CHAT = {
  /**
   * How many historical messages to fetch from Ably
   * Used in: ChatPanel.tsx
   */
  ABLY_HISTORY_LIMIT: 50,

  /**
   * Maximum length for chat messages (in characters)
   * Used in: Chat validation
   */
  MESSAGE_MAX_LENGTH: 500,
} as const

// ===========================================
// Video Player Constants
// ===========================================

export const VIDEO = {
  /**
   * HLS.js max buffer length (in seconds)
   * How much video to buffer ahead
   * Used in: WebinarPlayer.tsx
   */
  HLS_MAX_BUFFER_LENGTH: 30,

  /**
   * HLS.js absolute maximum buffer length (in seconds)
   * Hard limit on buffer size
   * Used in: WebinarPlayer.tsx
   */
  HLS_MAX_MAX_BUFFER_LENGTH: 60,
} as const

// ===========================================
// Session Generation Constants
// ===========================================

export const SESSION_GENERATION = {
  /**
   * How many days ahead to pre-generate sessions
   * Used in: interval-session-generator.ts
   */
  DAYS_AHEAD: 7,

  /**
   * Available interval options (in minutes)
   * Users can choose one of these fixed intervals for JIT sessions
   * Used in: ScheduleConfigForm.tsx
   */
  INTERVAL_OPTIONS: [5, 15, 30, 60] as const,

  /**
   * Default session start hour (24-hour format)
   * Used in: ScheduleConfigForm.tsx
   */
  DEFAULT_START_HOUR: 9, // 9 AM

  /**
   * Default session end hour (24-hour format)
   * Used in: ScheduleConfigForm.tsx
   */
  DEFAULT_END_HOUR: 17, // 5 PM
} as const

// ===========================================
// Notification Constants
// ===========================================

export const NOTIFICATIONS = {
  /**
   * How many minutes before session to send reminder
   * Used in: notification system
   */
  REMINDER_MINUTES_BEFORE: [60, 15, 5] as const, // 1 hour, 15 min, 5 min

  /**
   * How many hours after no-show to send follow-up
   * Used in: notification system
   */
  NO_SHOW_FOLLOW_UP_HOURS: 24,
} as const

// ===========================================
// Replay & Expiration Constants
// ===========================================

export const REPLAY = {
  /**
   * Default replay expiration (in days)
   * How many days after session ends before replay expires
   * Used in: access-state.ts
   */
  DEFAULT_EXPIRATION_DAYS: 7,
} as const

// ===========================================
// Helper Functions
// ===========================================

/**
 * Convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000
}

/**
 * Convert hours to milliseconds
 */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000
}

/**
 * Convert days to milliseconds
 */
export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000
}

// ===========================================
// Type Exports
// ===========================================

export type IntervalOption = typeof SESSION_GENERATION.INTERVAL_OPTIONS[number]
export type ReminderMinute = typeof NOTIFICATIONS.REMINDER_MINUTES_BEFORE[number]
