/**
 * Utilities for Interaction Builder
 */

import { formatTime } from '@/lib'

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Check if a string is a valid URL
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// Interaction Validation
// ============================================================================

export interface Interaction {
  id?: string
  type: string
  triggerTime: number
  duration: number | null
  title: string
  config: Record<string, unknown>
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  position: string
  enabled: boolean
}

/**
 * Validate an interaction before saving
 * @param interaction - Interaction to validate
 * @param videoDuration - Total video duration in seconds
 * @returns Array of error messages (empty if valid)
 */
export function validateInteraction(
  interaction: Partial<Interaction>,
  videoDuration: number
): string[] {
  const errors: string[] = []

  // Required fields
  if (!interaction.title?.trim()) {
    errors.push('Title is required')
  }

  // Time validation
  if (interaction.triggerTime !== undefined) {
    if (interaction.triggerTime < 0) {
      errors.push('Trigger time cannot be negative')
    }
    if (interaction.triggerTime > videoDuration) {
      errors.push(`Trigger time cannot exceed video duration (${formatTime(videoDuration)})`)
    }
  }

  // Type-specific validation
  if (interaction.type === 'POLL' || interaction.type === 'QUIZ') {
    const options = (interaction.config?.options as string[]) || []
    if (options.length < 2) {
      errors.push('At least 2 options required')
    }
    if (options.some((opt) => !opt.trim())) {
      errors.push('All options must have text')
    }
  }

  if (interaction.type === 'QUIZ') {
    const correctAnswers = (interaction.config?.correctAnswers as number[]) || []
    if (correctAnswers.length === 0) {
      errors.push('At least one correct answer required')
    }
  }

  if (interaction.type === 'CTA' || interaction.type === 'SPECIAL_OFFER') {
    const url = interaction.config?.buttonUrl as string
    if (url && !isValidUrl(url)) {
      errors.push('Invalid URL format')
    }
  }

  if (interaction.type === 'DOWNLOAD') {
    const url = interaction.config?.downloadUrl as string
    if (!url || !isValidUrl(url)) {
      errors.push('Valid download URL is required')
    }
  }

  return errors
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Detect timing conflicts between interactions
 * @param newInteraction - Interaction being added/edited
 * @param existingInteractions - All existing interactions
 * @returns Array of warning messages
 */
export function detectConflicts(
  newInteraction: Partial<Interaction>,
  existingInteractions: Interaction[]
): string[] {
  const warnings: string[] = []
  const triggerTime = newInteraction.triggerTime!

  existingInteractions.forEach((existing) => {
    // Skip if comparing to self during edit
    if (existing.id === newInteraction.id) return

    // Exact same time
    if (existing.triggerTime === triggerTime) {
      warnings.push(`Another interaction "${existing.title}" triggers at the same time`)
    }

    // Too close together (within 3 seconds)
    const timeDiff = Math.abs(existing.triggerTime - triggerTime)
    if (timeDiff < 3 && timeDiff > 0) {
      warnings.push(`Very close to "${existing.title}" (${timeDiff}s apart)`)
    }

    // Required interaction followed by another
    if (
      existing.required &&
      existing.triggerTime < triggerTime &&
      triggerTime - existing.triggerTime < 5
    ) {
      warnings.push(`Follows required interaction "${existing.title}" too closely`)
    }
  })

  return warnings
}

// ============================================================================
// Debounce Utility
// ============================================================================

/**
 * Creates a debounced version of a function
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
