/**
 * Time & Date Utilities
 *
 * Centralized time formatting and parsing functions
 * Supports Georgian (ka) and English (en) locales
 */

// Georgian month names for custom formatting
const monthsKa = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

const monthsEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export interface TimeFormatOptions {
  includeHours?: boolean
  includeMs?: boolean
}

// ===========================================
// TIME/DURATION FORMATTING (seconds to string)
// ===========================================

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
 * Format duration in seconds to human readable
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (MM:SS or HH:MM:SS)
 * @deprecated Use formatTime() instead - this is just an alias
 */
export function formatDuration(seconds: number): string {
  return formatTime(seconds)
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

// ===========================================
// DATE FORMATTING
// ===========================================

/**
 * Format a date for display with locale support
 * Returns format: "15 January, 2024" for ka/en or localized format
 * @param date - Date to format
 * @param locale - Locale string ('ka', 'en', or full locale like 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // Use custom Georgian formatting for better control
  if (locale === 'ka' || locale === 'ka-GE') {
    const day = d.getDate()
    const year = d.getFullYear()
    const month = monthsKa[d.getMonth()]
    return `${day} ${month}, ${year}`
  }

  // Use custom English formatting for consistency
  if (locale === 'en' || locale === 'en-US') {
    const day = d.getDate()
    const year = d.getFullYear()
    const month = monthsEn[d.getMonth()]
    return `${day} ${month}, ${year}`
  }

  // Fallback to browser locale formatting
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
  const localeCode = locale === 'ka' ? 'ka-GE' : locale === 'en' ? 'en-US' : locale
  return d.toLocaleString(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ===========================================
// RELATIVE TIME
// ===========================================

/**
 * Format a relative time (e.g., "2 days ago")
 * @param date - Date to compare against now
 * @param locale - Locale string ('ka' or 'en')
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  const isKa = locale === 'ka' || locale === 'ka-GE'

  if (diffMinutes < 1) {
    return isKa ? 'ახლახანს' : 'Just now'
  }
  if (diffMinutes < 60) {
    return isKa
      ? `${diffMinutes} წუთის წინ`
      : `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  }
  if (diffHours < 24) {
    return isKa
      ? `${diffHours} საათის წინ`
      : `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  }
  if (diffDays === 0) {
    return isKa ? 'დღეს' : 'Today'
  }
  if (diffDays === 1) {
    return isKa ? 'გუშინ' : 'Yesterday'
  }
  if (diffDays < 7) {
    return isKa
      ? `${diffDays} დღის წინ`
      : `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return isKa
      ? `${weeks} კვირის წინ`
      : `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }

  return formatDate(d, locale)
}

/**
 * Format relative time in the past (e.g., "2 days ago")
 * @deprecated Use formatRelativeTime() instead - this is just an alias for backwards compatibility
 */
export function getRelativeTime(date: Date | string, locale: string = 'en'): string {
  return formatRelativeTime(date, locale)
}
