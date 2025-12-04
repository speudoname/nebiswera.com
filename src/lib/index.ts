/**
 * Shared Library Index
 *
 * Centralized exports for all shared utilities
 */

// Time utilities
export {
  formatTime,
  parseTime,
  formatDate,
  formatDateTime,
  type TimeFormatOptions
} from './time-utils'

// Validation utilities
export {
  EMAIL_REGEX,
  isValidEmail,
  normalizeEmail,
  validateAndNormalizeEmail,
  getErrorMessage,
  sanitizeText
} from './validation-utils'

// API response utilities
export {
  ApiError,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse
} from './api-response'

// Logger utility
export { logger } from './logger'

// Existing utilities (re-export for convenience)
export * from './db'
export * from './email'
export * from './rate-limit'
export * from './auth/utils'
