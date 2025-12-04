/**
 * Time Utilities
 *
 * Centralized time formatting and parsing functions
 */

export interface TimeFormatOptions {
  includeHours?: boolean
  includeMs?: boolean
}

/**
 * Convert seconds to time string (MM:SS or HH:MM:SS)
 * @param seconds - Time in seconds
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(seconds: number, options?: TimeFormatOptions): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)

  if (hrs > 0 || options?.includeHours) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  if (options?.includeMs) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse time string to seconds
 * @param timeStr - Time string (HH:MM:SS, MM:SS, or SS)
 * @returns Time in seconds
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return parseInt(timeStr) || 0
}

/**
 * Format date to localized string
 * @param date - Date to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date and time to localized string
 * @param date - Date to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
