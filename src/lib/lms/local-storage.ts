/**
 * LMS Local Storage Utilities
 *
 * Handles anonymous progress tracking for open courses using localStorage.
 * This allows users to track progress without an account.
 */

import type {
  LocalStorageLmsData,
  LocalStorageCourseProgress,
  LocalStoragePartProgress,
  LocalStorageQuizAttempt,
} from './types'

const STORAGE_KEY = 'nebiswera_lms'
const ANONYMOUS_ID_KEY = 'nebiswera_anonymous_id'

/**
 * Generate a unique anonymous ID
 */
export function generateAnonymousId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `anon_${timestamp}_${randomPart}`
}

/**
 * Get or create anonymous ID
 */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''

  let id = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (!id) {
    id = generateAnonymousId()
    localStorage.setItem(ANONYMOUS_ID_KEY, id)
  }
  return id
}

/**
 * Get all LMS data from localStorage
 */
export function getLmsData(): LocalStorageLmsData {
  if (typeof window === 'undefined') {
    return { anonymousId: '', courses: {} }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to parse LMS data from localStorage:', e)
  }

  return {
    anonymousId: getAnonymousId(),
    courses: {},
  }
}

/**
 * Save LMS data to localStorage
 */
export function saveLmsData(data: LocalStorageLmsData): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save LMS data to localStorage:', e)
  }
}

/**
 * Get course progress from localStorage
 */
export function getCourseProgress(courseId: string): LocalStorageCourseProgress | null {
  const data = getLmsData()
  return data.courses[courseId] || null
}

/**
 * Initialize course progress in localStorage
 */
export function initializeCourseProgress(courseId: string): LocalStorageCourseProgress {
  const data = getLmsData()

  if (!data.courses[courseId]) {
    const now = new Date().toISOString()
    data.courses[courseId] = {
      enrolledAt: now,
      parts: {},
      quizAttempts: {},
      lastAccessedAt: now,
    }
    saveLmsData(data)
  }

  return data.courses[courseId]
}

/**
 * Update part progress in localStorage
 */
export function updatePartProgress(
  courseId: string,
  partId: string,
  progress: Partial<LocalStoragePartProgress>
): LocalStoragePartProgress {
  const data = getLmsData()

  if (!data.courses[courseId]) {
    initializeCourseProgress(courseId)
  }

  const existingProgress = data.courses[courseId].parts[partId] || {
    status: 'not_started' as const,
    watchTime: 0,
    watchPercent: 0,
  }

  const updatedProgress: LocalStoragePartProgress = {
    ...existingProgress,
    ...progress,
  }

  data.courses[courseId].parts[partId] = updatedProgress
  data.courses[courseId].lastAccessedAt = new Date().toISOString()
  data.courses[courseId].lastPartId = partId

  saveLmsData(data)

  return updatedProgress
}

/**
 * Mark a part as complete in localStorage
 */
export function markPartCompleteLocal(courseId: string, partId: string): LocalStoragePartProgress {
  return updatePartProgress(courseId, partId, {
    status: 'completed',
    watchPercent: 100,
    completedAt: new Date().toISOString(),
  })
}

/**
 * Update video progress in localStorage
 */
export function updateVideoProgressLocal(
  courseId: string,
  partId: string,
  watchTime: number,
  watchPercent: number,
  autoCompleteThreshold: number = 90
): LocalStoragePartProgress {
  const isComplete = watchPercent >= autoCompleteThreshold

  return updatePartProgress(courseId, partId, {
    status: isComplete ? 'completed' : 'in_progress',
    watchTime,
    watchPercent,
    ...(isComplete && { completedAt: new Date().toISOString() }),
  })
}

/**
 * Get part progress from localStorage
 */
export function getPartProgress(courseId: string, partId: string): LocalStoragePartProgress | null {
  const courseProgress = getCourseProgress(courseId)
  return courseProgress?.parts[partId] || null
}

/**
 * Check if a part is completed in localStorage
 */
export function isPartCompletedLocal(courseId: string, partId: string): boolean {
  const progress = getPartProgress(courseId, partId)
  return progress?.status === 'completed'
}

/**
 * Calculate overall course progress percentage from localStorage
 */
export function calculateCourseProgressLocal(courseId: string, totalParts: number): number {
  const courseProgress = getCourseProgress(courseId)
  if (!courseProgress || totalParts === 0) return 0

  const completedCount = Object.values(courseProgress.parts).filter(
    (p) => p.status === 'completed'
  ).length

  return Math.round((completedCount / totalParts) * 100)
}

/**
 * Get the last accessed part ID
 */
export function getLastAccessedPart(courseId: string): string | null {
  const courseProgress = getCourseProgress(courseId)
  return courseProgress?.lastPartId || null
}

/**
 * Get the next uncompleted part ID
 */
export function getNextUncompletedPartLocal(
  courseId: string,
  orderedPartIds: string[]
): string | null {
  const courseProgress = getCourseProgress(courseId)
  if (!courseProgress) return orderedPartIds[0] || null

  for (const partId of orderedPartIds) {
    const progress = courseProgress.parts[partId]
    if (!progress || progress.status !== 'completed') {
      return partId
    }
  }

  // All parts completed, return the last one
  return orderedPartIds[orderedPartIds.length - 1] || null
}

/**
 * Record a quiz attempt in localStorage
 */
export function recordQuizAttemptLocal(
  courseId: string,
  quizId: string,
  attempt: Omit<LocalStorageQuizAttempt, 'quizId'>
): void {
  const data = getLmsData()

  if (!data.courses[courseId]) {
    initializeCourseProgress(courseId)
  }

  if (!data.courses[courseId].quizAttempts[quizId]) {
    data.courses[courseId].quizAttempts[quizId] = []
  }

  data.courses[courseId].quizAttempts[quizId].push({
    ...attempt,
    quizId,
  })

  saveLmsData(data)
}

/**
 * Get quiz attempts from localStorage
 */
export function getQuizAttemptsLocal(
  courseId: string,
  quizId: string
): LocalStorageQuizAttempt[] {
  const courseProgress = getCourseProgress(courseId)
  return courseProgress?.quizAttempts[quizId] || []
}

/**
 * Check if quiz was passed in localStorage
 */
export function isQuizPassedLocal(courseId: string, quizId: string): boolean {
  const attempts = getQuizAttemptsLocal(courseId, quizId)
  return attempts.some((a) => a.passed === true)
}

/**
 * Get all course progress data for migration
 */
export function getAllProgressForMigration(): {
  anonymousId: string
  courses: Record<string, LocalStorageCourseProgress>
} {
  const data = getLmsData()
  return {
    anonymousId: data.anonymousId,
    courses: data.courses,
  }
}

/**
 * Clear progress for a specific course (after migration)
 */
export function clearCourseProgress(courseId: string): void {
  const data = getLmsData()
  delete data.courses[courseId]
  saveLmsData(data)
}

/**
 * Clear all LMS data (after full migration)
 */
export function clearAllLmsData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if there's any progress to migrate
 */
export function hasProgressToMigrate(): boolean {
  const data = getLmsData()
  return Object.keys(data.courses).length > 0
}

/**
 * Get courses with progress for migration prompt
 */
export function getCoursesWithProgress(): string[] {
  const data = getLmsData()
  return Object.keys(data.courses).filter((courseId) => {
    const progress = data.courses[courseId]
    return Object.keys(progress.parts).length > 0
  })
}
