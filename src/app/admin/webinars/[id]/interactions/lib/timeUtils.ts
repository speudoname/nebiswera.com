/**
 * Time Utility Functions for Interaction Editor
 *
 * Converts between seconds and MM:SS format for video timestamps
 */

/**
 * Format seconds to MM:SS display format
 * @param seconds - Number of seconds
 * @returns Formatted string like "5:30" or "12:05"
 *
 * @example
 * formatTime(90) // "1:30"
 * formatTime(325) // "5:25"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse MM:SS or raw number string to seconds
 * @param timeStr - Time string in format "MM:SS" or raw seconds
 * @returns Number of seconds
 *
 * @example
 * parseTime("5:30") // 330
 * parseTime("90") // 90
 * parseTime("1:05") // 65
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return parseInt(timeStr) || 0
}
