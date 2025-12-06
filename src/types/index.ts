/**
 * Type Definitions Index
 *
 * Centralized exports for all type definitions
 * Import from here instead of individual files
 */

// Webinar types
export type {
  InteractionData,
  InteractionDataFull,
  InteractionType,
  InteractionPosition,
  InteractionOption,
  InteractionResponse,
  Webinar,
  WebinarSession,
  WebinarWithRelations,
  WebinarAccessResult
} from './webinar'

export {
  isInteractionType,
  hasOptions,
  requiresCorrectAnswer
} from './webinar'

// Analytics types
export type {
  SessionEvent,
  EngagementMetrics,
  WatchTimeBucket,
  DropOffPoint,
  InteractionMetrics,
  WebinarAnalytics,
  LiveViewerMetrics,
  SessionAnalytics,
  AnalyticsFilters,
  AnalyticsExportRequest
} from './analytics'

export {
  SessionEventType,
  AnalyticsTimeRange,
  AnalyticsExportFormat
} from './analytics'

// Registration types
export type {
  RegistrationField,
  RegistrationFieldValue,
  Registration,
  RegistrationWithRelations,
  RegistrationFormData,
  RegistrationValidationResult,
  RegistrationExport,
  RegistrationSettings
} from './registration'

export {
  RegistrationFieldType,
  RegistrationStatus,
  isConfirmedRegistration,
  hasAttended,
  isActiveRegistration,
  getFullName
} from './registration'

// Utility types
export type {
  PaginatedResponse,
  PaginationParams,
  ApiErrorResponse,
  ApiSuccessResponse,
  Filter,
  Sort,
  DateRange,
  UploadProgress,
  FileUpload,
  AsyncOperationState,
  WebhookPayload,
  SearchParams,
  RouteParams,
  Nullable,
  Optional,
  DeepPartial,
  RequireFields,
  PartialFields,
  UnwrapPromise,
  UnwrapArray,
  ISODateString,
  EmailAddress,
  URLString,
  UUID,
  JSONValue,
  JSONObject,
  EnvConfig,
  FeatureFlags
} from './utils'

export type {
  FilterOperator,
  SortDirection
} from './utils'

export {
  UploadStatus,
  AsyncOperationStatus,
  WebhookEventType
} from './utils'
