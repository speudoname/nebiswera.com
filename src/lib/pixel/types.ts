/**
 * Facebook Pixel Types and Constants
 */

// Standard Facebook Pixel events
export type StandardPixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'AddToCart'
  | 'Purchase'
  | 'Search'
  | 'AddPaymentInfo'
  | 'AddToWishlist'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'

// Custom events for our platform
export type CustomPixelEvent =
  | 'WebinarStarted'
  | 'WebinarEngaged'
  | 'WebinarCompleted'
  | 'WebinarCTAClick'
  | 'CourseStarted'
  | 'LessonStarted'
  | 'LessonCompleted'
  | 'CourseCompleted'
  | 'QuizCompleted'

export type PixelEventName = StandardPixelEvent | CustomPixelEvent

// Page types for categorization
export type PageType =
  | 'home'
  | 'about'
  | 'blog'
  | 'blog-list'
  | 'webinar-landing'
  | 'webinar-watch'
  | 'lms-course'
  | 'lms-lesson'
  | 'landing'
  | 'other'

// Event source
export type EventSource = 'client' | 'server'

// Event status
export type EventStatus = 'sent' | 'failed' | 'test'

// Standard event parameters
export interface PixelEventParams {
  // Standard parameters
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
  num_items?: number
  search_string?: string
  status?: string

  // Custom parameters for our platform
  webinar_id?: string
  webinar_name?: string
  course_id?: string
  course_name?: string
  lesson_id?: string
  lesson_name?: string
  blog_post_id?: string
  blog_post_title?: string
  completion_percent?: number
  watch_time_seconds?: number
  cta_type?: string
  cta_text?: string

  // Allow additional custom parameters
  [key: string]: string | number | string[] | boolean | undefined
}

// User data for Advanced Matching (will be hashed before sending)
export interface UserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  dateOfBirth?: string // YYYYMMDD format
  gender?: 'm' | 'f'
  externalId?: string // Your user ID
}

// Hashed user data (after SHA-256 hashing)
export interface HashedUserData {
  em?: string // hashed email
  ph?: string // hashed phone
  fn?: string // hashed first name
  ln?: string // hashed last name
  ct?: string // hashed city
  st?: string // hashed state
  zp?: string // hashed zip
  country?: string // ISO country code (not hashed)
  db?: string // hashed date of birth
  ge?: string // hashed gender
  external_id?: string // hashed external ID
  client_ip_address?: string // IP address (not hashed)
  client_user_agent?: string // User agent (not hashed)
  fbp?: string // Facebook browser ID cookie
  fbc?: string // Facebook click ID cookie
}

// Track event request from client
export interface TrackEventRequest {
  eventName: PixelEventName
  eventId?: string // Will be generated if not provided
  pageType: PageType
  pageUrl: string
  params?: PixelEventParams
  userData?: UserData
  fbp?: string
  fbc?: string
}

// Server-side event for Conversions API
export interface ConversionsAPIEvent {
  event_name: string
  event_time: number // Unix timestamp in seconds
  event_id: string
  event_source_url: string
  action_source: 'website'
  user_data: HashedUserData
  custom_data?: PixelEventParams
  opt_out?: boolean
}

// Conversions API request body
export interface ConversionsAPIRequest {
  data: ConversionsAPIEvent[]
  test_event_code?: string // For testing
}

// Conversions API response
export interface ConversionsAPIResponse {
  events_received: number
  messages?: string[]
  fbtrace_id?: string
}

// Pixel configuration from database
export interface PixelConfig {
  fbPixelId: string | null
  fbAccessToken: string | null
  fbTestEventCode: string | null
  fbPixelEnabled: boolean
  fbTestMode: boolean
}

// Event log entry
export interface PixelEventLogEntry {
  eventId: string
  eventName: string
  source: EventSource
  pageType: string
  pageUrl: string
  userId?: string
  contactId?: string
  fbp?: string
  fbc?: string
  eventData?: PixelEventParams
  userData?: Record<string, boolean> // Field presence indicators
  status: EventStatus
  errorMsg?: string
  fbResponse?: ConversionsAPIResponse
}

// ViewContent tracking configuration
export interface ViewContentConfig {
  scrollThreshold: number // 0-1, e.g., 0.7 for 70%
  timeThresholdSeconds: number // Minimum time on page
  requireBoth: boolean // If true, both scroll AND time must be met
}

// Default ViewContent configurations by page type
export const DEFAULT_VIEW_CONTENT_CONFIG: Record<PageType, ViewContentConfig> = {
  blog: { scrollThreshold: 0.7, timeThresholdSeconds: 0, requireBoth: true }, // 70% scroll + 70% read time (calculated dynamically)
  'blog-list': { scrollThreshold: 0.5, timeThresholdSeconds: 15, requireBoth: false },
  'webinar-landing': { scrollThreshold: 0.6, timeThresholdSeconds: 30, requireBoth: false },
  'webinar-watch': { scrollThreshold: 0, timeThresholdSeconds: 0, requireBoth: false }, // Uses custom events instead
  'lms-course': { scrollThreshold: 0.5, timeThresholdSeconds: 20, requireBoth: false },
  'lms-lesson': { scrollThreshold: 0, timeThresholdSeconds: 0, requireBoth: false }, // Uses custom events instead
  home: { scrollThreshold: 0.5, timeThresholdSeconds: 20, requireBoth: false },
  about: { scrollThreshold: 0.5, timeThresholdSeconds: 20, requireBoth: false },
  landing: { scrollThreshold: 0.5, timeThresholdSeconds: 20, requireBoth: false },
  other: { scrollThreshold: 0.5, timeThresholdSeconds: 20, requireBoth: false },
}
