/**
 * Utility Functions
 */

/**
 * Combines class names, filtering out falsy values
 * Simple alternative to clsx/classnames libraries
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) {
    return locale === 'ka' ? 'ახლახანს' : 'Just now'
  }
  if (diffMinutes < 60) {
    return locale === 'ka'
      ? `${diffMinutes} წუთის წინ`
      : `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  }
  if (diffHours < 24) {
    return locale === 'ka'
      ? `${diffHours} საათის წინ`
      : `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  }
  if (diffDays === 1) {
    return locale === 'ka' ? 'გუშინ' : 'Yesterday'
  }
  if (diffDays < 7) {
    return locale === 'ka'
      ? `${diffDays} დღის წინ`
      : `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return locale === 'ka'
      ? `${weeks} კვირის წინ`
      : `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }

  return formatDate(d, locale)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
