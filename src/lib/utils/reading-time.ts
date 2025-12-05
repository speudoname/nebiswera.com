/**
 * Reading time calculation utilities
 */

/**
 * Calculate estimated reading time from HTML content
 * Assumes ~200 words per minute reading speed
 */
export function calculateReadingTime(html: string): number {
  if (!html) return 1

  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')

  // Count words
  const words = text.split(/\s+/).filter(Boolean).length

  // Calculate minutes (minimum 1 minute)
  return Math.max(1, Math.ceil(words / 200))
}

/**
 * Extract a plain text excerpt from HTML content
 */
export function extractExcerpt(html: string, maxLength = 160): string {
  if (!html) return ''

  // Strip HTML tags and normalize whitespace
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  if (text.length <= maxLength) return text

  // Cut at word boundary and add ellipsis
  return text.substring(0, maxLength - 3).replace(/\s+\S*$/, '') + '...'
}

/**
 * Count words in HTML content
 */
export function countWords(html: string): number {
  if (!html) return 0

  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.split(' ').filter(word => word.length > 0).length
}
