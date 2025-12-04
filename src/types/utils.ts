/**
 * Shared Utility Types
 *
 * Common types used across the application
 */

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: Record<string, any>
}

/**
 * API success response wrapper
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

/**
 * Filter operators
 */
export type FilterOperator =
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains'// string contains
  | 'startsWith' // string starts with
  | 'endsWith'   // string ends with

/**
 * Generic filter
 */
export interface Filter {
  field: string
  operator: FilterOperator
  value: any
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Sort configuration
 */
export interface Sort {
  field: string
  direction: SortDirection
}

/**
 * Date range filter
 */
export interface DateRange {
  startDate: Date
  endDate: Date
}

/**
 * Upload status
 */
export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Upload progress
 */
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  speed?: number
  timeRemaining?: number
}

/**
 * File upload metadata
 */
export interface FileUpload {
  id: string
  filename: string
  size: number
  mimeType: string
  status: UploadStatus
  progress: UploadProgress
  url?: string
  error?: string
  uploadedAt?: Date
  completedAt?: Date
}

/**
 * Async operation status
 */
export enum AsyncOperationStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Async operation state
 */
export interface AsyncOperationState<T = any> {
  status: AsyncOperationStatus
  data?: T
  error?: string
  lastUpdated?: Date
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  WEBINAR_CREATED = 'webinar.created',
  WEBINAR_UPDATED = 'webinar.updated',
  WEBINAR_DELETED = 'webinar.deleted',
  REGISTRATION_CREATED = 'registration.created',
  REGISTRATION_CONFIRMED = 'registration.confirmed',
  REGISTRATION_CANCELLED = 'registration.cancelled',
  SESSION_STARTED = 'session.started',
  SESSION_COMPLETED = 'session.completed',
  INTERACTION_RESPONDED = 'interaction.responded'
}

/**
 * Webhook payload
 */
export interface WebhookPayload<T = any> {
  event: WebhookEventType
  timestamp: Date
  data: T
  metadata?: Record<string, any>
}

/**
 * Search params (for API routes)
 */
export type SearchParams = Record<string, string | string[] | undefined>

/**
 * Route params (for dynamic routes)
 */
export type RouteParams = Record<string, string>

/**
 * Nullable utility type
 */
export type Nullable<T> = T | null

/**
 * Optional utility type
 */
export type Optional<T> = T | undefined

/**
 * Deep partial utility type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific properties optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * Extract array type
 */
export type UnwrapArray<T> = T extends Array<infer U> ? U : T

/**
 * ISO date string
 */
export type ISODateString = string

/**
 * Email address string
 */
export type EmailAddress = string

/**
 * URL string
 */
export type URLString = string

/**
 * UUID string
 */
export type UUID = string

/**
 * JSON value types
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

/**
 * JSON object
 */
export type JSONObject = { [key: string]: JSONValue }

/**
 * Environment variable config
 */
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  [key: string]: string | undefined
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  enableAnalytics: boolean
  enableChat: boolean
  enableInteractions: boolean
  enableRegistrations: boolean
  enableAutomation: boolean
  enableWebhooks: boolean
  [key: string]: boolean
}
