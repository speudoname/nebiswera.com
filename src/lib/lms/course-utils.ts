/**
 * LMS Course Utilities
 *
 * Shared utilities for course structure manipulation,
 * part navigation, and progress calculation.
 */

import type { CourseWithStructure } from './queries'

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface PartWithContext {
  id: string
  title: string
  order: number
  lessonId: string
  lessonTitle: string
  moduleId?: string
  moduleTitle?: string
  flatIndex: number // Position in the entire course (0-based)
}

interface PartProgressRecord {
  partId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
}

// ===========================================
// PART UTILITIES
// ===========================================

/**
 * Get all parts from a course in order with context (lesson/module info)
 */
export function getAllParts(course: CourseWithStructure): PartWithContext[] {
  const parts: PartWithContext[] = []
  let flatIndex = 0

  // Parts from modules
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        parts.push({
          id: part.id,
          title: part.title,
          order: part.order,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleId: module.id,
          moduleTitle: module.title,
          flatIndex,
        })
        flatIndex++
      }
    }
  }

  // Parts from direct lessons (no module)
  for (const lesson of course.lessons) {
    for (const part of lesson.parts) {
      parts.push({
        id: part.id,
        title: part.title,
        order: part.order,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        flatIndex,
      })
      flatIndex++
    }
  }

  return parts
}

/**
 * Get a specific part by ID with context
 */
export function getPartById(course: CourseWithStructure, partId: string): PartWithContext | null {
  const allParts = getAllParts(course)
  return allParts.find((p) => p.id === partId) || null
}

/**
 * Get the flat index of a part in the course
 */
export function getPartIndex(course: CourseWithStructure, partId: string): number {
  const allParts = getAllParts(course)
  const index = allParts.findIndex((p) => p.id === partId)
  return index
}

/**
 * Get total number of parts in a course
 */
export function getTotalPartCount(course: CourseWithStructure): number {
  let count = 0

  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      count += lesson.parts.length
    }
  }

  for (const lesson of course.lessons) {
    count += lesson.parts.length
  }

  return count
}

/**
 * Get count of completed parts
 */
export function getCompletedPartCount(progress: PartProgressRecord[]): number {
  return progress.filter((p) => p.status === 'COMPLETED').length
}

/**
 * Get all part IDs from a course
 */
export function getAllPartIds(course: CourseWithStructure): string[] {
  return getAllParts(course).map((p) => p.id)
}

// ===========================================
// NAVIGATION UTILITIES
// ===========================================

/**
 * Get the next part after the current one
 */
export function getNextPart(course: CourseWithStructure, currentPartId: string): PartWithContext | null {
  const allParts = getAllParts(course)
  const currentIndex = allParts.findIndex((p) => p.id === currentPartId)

  if (currentIndex === -1 || currentIndex >= allParts.length - 1) {
    return null
  }

  return allParts[currentIndex + 1]
}

/**
 * Get the previous part before the current one
 */
export function getPrevPart(course: CourseWithStructure, currentPartId: string): PartWithContext | null {
  const allParts = getAllParts(course)
  const currentIndex = allParts.findIndex((p) => p.id === currentPartId)

  if (currentIndex <= 0) {
    return null
  }

  return allParts[currentIndex - 1]
}

/**
 * Get the first uncompleted part for resume functionality
 */
export function getFirstUncompletedPart(
  course: CourseWithStructure,
  progress: PartProgressRecord[]
): PartWithContext | null {
  const completedIds = new Set(progress.filter((p) => p.status === 'COMPLETED').map((p) => p.partId))
  const allParts = getAllParts(course)

  for (const part of allParts) {
    if (!completedIds.has(part.id)) {
      return part
    }
  }

  // All parts completed - return the last part
  return allParts[allParts.length - 1] || null
}

/**
 * Get the first part of a course
 */
export function getFirstPart(course: CourseWithStructure): PartWithContext | null {
  const allParts = getAllParts(course)
  return allParts[0] || null
}

/**
 * Get the last part of a course
 */
export function getLastPart(course: CourseWithStructure): PartWithContext | null {
  const allParts = getAllParts(course)
  return allParts[allParts.length - 1] || null
}

// ===========================================
// PROGRESS CALCULATION
// ===========================================

/**
 * Calculate progress percentage from completed parts count
 */
export function calculateProgressPercent(totalParts: number, completedParts: number): number {
  if (totalParts === 0) return 0
  return Math.round((completedParts / totalParts) * 100)
}

/**
 * Calculate progress percentage from progress array
 */
export function calculateProgressFromArray(
  course: CourseWithStructure,
  progress: PartProgressRecord[]
): number {
  const total = getTotalPartCount(course)
  const completed = getCompletedPartCount(progress)
  return calculateProgressPercent(total, completed)
}

/**
 * Check if a part is completed
 */
export function isPartCompleted(partId: string, progress: PartProgressRecord[]): boolean {
  const partProgress = progress.find((p) => p.partId === partId)
  return partProgress?.status === 'COMPLETED'
}

/**
 * Check if all parts are completed
 */
export function isAllPartsCompleted(course: CourseWithStructure, progress: PartProgressRecord[]): boolean {
  const total = getTotalPartCount(course)
  const completed = getCompletedPartCount(progress)
  return total > 0 && completed >= total
}

// ===========================================
// LOCK CHECKING UTILITIES
// ===========================================

/**
 * Check if a part is locked due to sequential lock
 */
export function isPartLocked(
  course: CourseWithStructure,
  partId: string,
  progress: PartProgressRecord[],
  sequentialLock: boolean
): boolean {
  if (!sequentialLock) return false

  const allParts = getAllParts(course)
  const partIndex = allParts.findIndex((p) => p.id === partId)

  // First part is never locked
  if (partIndex <= 0) return false

  // Check if previous part is completed
  const prevPart = allParts[partIndex - 1]
  return !isPartCompleted(prevPart.id, progress)
}

/**
 * Get all unlocked parts
 */
export function getUnlockedParts(
  course: CourseWithStructure,
  progress: PartProgressRecord[],
  sequentialLock: boolean
): PartWithContext[] {
  const allParts = getAllParts(course)

  if (!sequentialLock) return allParts

  return allParts.filter((part) => !isPartLocked(course, part.id, progress, sequentialLock))
}
