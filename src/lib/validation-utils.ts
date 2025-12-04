/**
 * Validation Utilities
 *
 * Centralized validation and normalization functions
 */

/**
 * Email validation regex (RFC 5322 simplified)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Normalize email address (lowercase and trim)
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Validate and normalize email in one step
 * @param email - Email address
 * @returns Normalized email if valid, null if invalid
 */
export function validateAndNormalizeEmail(email: string): string | null {
  const normalized = normalizeEmail(email)
  return isValidEmail(normalized) ? normalized : null
}

/**
 * Extract error message from unknown error type
 * @param error - Error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

/**
 * Sanitize text input (remove HTML tags)
 * @param text - Input text
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, '')
}
