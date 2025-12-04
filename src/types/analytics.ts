/**
 * Analytics Type Definitions
 *
 * Centralized type definitions for webinar analytics and tracking
 */

/**
 * Session event types
 */
export enum SessionEventType {
  PLAY = 'play',
  PAUSE = 'pause',
  SEEK = 'seek',
  BUFFER = 'buffer',
  END = 'end',
  INTERACTION = 'interaction',
  CHAT_MESSAGE = 'chat_message'
}

/**
 * Session analytics event
 */
export interface SessionEvent {
  id: string
  sessionId: string
  type: SessionEventType
  timestamp: number
  position: number
  metadata?: Record<string, any>
  createdAt: Date
}

/**
 * Engagement metrics for a time period
 */
export interface EngagementMetrics {
  timestamp: number
  viewerCount: number
  avgWatchTime: number
  completionRate: number
  interactionRate: number
  chatActivity: number
}

/**
 * Watch time distribution bucket
 */
export interface WatchTimeBucket {
  range: string
  count: number
  percentage: number
}

/**
 * Drop-off point in video
 */
export interface DropOffPoint {
  timestamp: number
  viewers: number
  dropRate: number
}

/**
 * Interaction performance metrics
 */
export interface InteractionMetrics {
  interactionId: string
  type: string
  question: string
  timestamp: number
  responseCount: number
  responseRate: number
  avgResponseTime: number
  correctRate?: number
  responses?: {
    answer: string
    count: number
    percentage: number
  }[]
}

/**
 * Webinar analytics summary
 */
export interface WebinarAnalytics {
  webinarId: string
  totalSessions: number
  uniqueViewers: number
  totalWatchTime: number
  avgWatchTime: number
  completionRate: number
  interactionRate: number
  chatMessages: number
  registrations: number
  conversionRate: number
  peakViewers: number
  peakViewersAt?: Date
  engagementMetrics: EngagementMetrics[]
  watchTimeDistribution: WatchTimeBucket[]
  dropOffPoints: DropOffPoint[]
  interactionMetrics: InteractionMetrics[]
  topReferrers?: {
    source: string
    count: number
  }[]
  deviceBreakdown?: {
    device: string
    count: number
    percentage: number
  }[]
  geographicBreakdown?: {
    country: string
    count: number
    percentage: number
  }[]
}

/**
 * Real-time viewer analytics
 */
export interface LiveViewerMetrics {
  currentViewers: number
  avgPosition: number
  activeInteractions: number
  recentChatMessages: number
  viewersByPosition: {
    position: number
    count: number
  }[]
}

/**
 * Session analytics (for individual session analysis)
 */
export interface SessionAnalytics {
  sessionId: string
  userId?: string
  email?: string
  startedAt: Date
  endedAt?: Date
  totalWatchTime: number
  watchPercentage: number
  completed: boolean
  interactionsResponded: number
  interactionsTotal: number
  chatMessages: number
  events: SessionEvent[]
  referrer?: string
  device?: string
  location?: {
    country: string
    city?: string
  }
}

/**
 * Analytics time range filter
 */
export enum AnalyticsTimeRange {
  LAST_24H = 'last_24h',
  LAST_7D = 'last_7d',
  LAST_30D = 'last_30d',
  LAST_90D = 'last_90d',
  ALL_TIME = 'all_time',
  CUSTOM = 'custom'
}

/**
 * Analytics filter options
 */
export interface AnalyticsFilters {
  timeRange: AnalyticsTimeRange
  startDate?: Date
  endDate?: Date
  userSegment?: string
  completedOnly?: boolean
  registeredOnly?: boolean
}

/**
 * Export formats for analytics
 */
export enum AnalyticsExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx'
}

/**
 * Analytics export request
 */
export interface AnalyticsExportRequest {
  webinarId: string
  format: AnalyticsExportFormat
  filters?: AnalyticsFilters
  includeEvents?: boolean
  includeResponses?: boolean
}
