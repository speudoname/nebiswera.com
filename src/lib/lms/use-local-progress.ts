'use client'

/**
 * React Hook for Local Storage Progress
 *
 * Provides a reactive interface for managing course progress in localStorage
 * for anonymous users taking open courses.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAnonymousId,
  getCourseProgress,
  initializeCourseProgress,
  updatePartProgress,
  markPartCompleteLocal,
  updateVideoProgressLocal,
  getPartProgress,
  isPartCompletedLocal,
  calculateCourseProgressLocal,
  getNextUncompletedPartLocal,
  recordQuizAttemptLocal,
  getQuizAttemptsLocal,
  isQuizPassedLocal,
} from './local-storage'
import type {
  LocalStorageCourseProgress,
  LocalStoragePartProgress,
  LocalStorageQuizAttempt,
} from './types'

interface UseLocalProgressOptions {
  courseId: string
  totalParts: number
  orderedPartIds: string[]
  videoCompletionThreshold?: number
}

interface UseLocalProgressReturn {
  // Data
  anonymousId: string
  progress: LocalStorageCourseProgress | null
  progressPercent: number

  // Part progress
  getPartProgress: (partId: string) => LocalStoragePartProgress | null
  isPartCompleted: (partId: string) => boolean
  getNextUncompletedPart: () => string | null

  // Actions
  markPartComplete: (partId: string) => void
  updateVideoProgress: (partId: string, watchTime: number, watchPercent: number) => void

  // Quiz
  recordQuizAttempt: (quizId: string, attempt: Omit<LocalStorageQuizAttempt, 'quizId'>) => void
  getQuizAttempts: (quizId: string) => LocalStorageQuizAttempt[]
  isQuizPassed: (quizId: string) => boolean

  // State
  isLoaded: boolean
}

export function useLocalProgress({
  courseId,
  totalParts,
  orderedPartIds,
  videoCompletionThreshold = 90,
}: UseLocalProgressOptions): UseLocalProgressReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [anonymousId, setAnonymousId] = useState('')
  const [progress, setProgress] = useState<LocalStorageCourseProgress | null>(null)
  const [progressPercent, setProgressPercent] = useState(0)

  // Initialize on mount
  useEffect(() => {
    const id = getAnonymousId()
    setAnonymousId(id)

    // Initialize course progress if it doesn't exist
    const courseProgress = getCourseProgress(courseId) || initializeCourseProgress(courseId)
    setProgress(courseProgress)

    // Calculate initial progress
    const percent = calculateCourseProgressLocal(courseId, totalParts)
    setProgressPercent(percent)

    setIsLoaded(true)
  }, [courseId, totalParts])

  // Get part progress
  const getPartProgressFn = useCallback(
    (partId: string): LocalStoragePartProgress | null => {
      return getPartProgress(courseId, partId)
    },
    [courseId]
  )

  // Check if part is completed
  const isPartCompletedFn = useCallback(
    (partId: string): boolean => {
      return isPartCompletedLocal(courseId, partId)
    },
    [courseId]
  )

  // Get next uncompleted part
  const getNextUncompletedPartFn = useCallback((): string | null => {
    return getNextUncompletedPartLocal(courseId, orderedPartIds)
  }, [courseId, orderedPartIds])

  // Mark part complete
  const markPartCompleteFn = useCallback(
    (partId: string): void => {
      markPartCompleteLocal(courseId, partId)

      // Refresh state
      const courseProgress = getCourseProgress(courseId)
      setProgress(courseProgress)

      const percent = calculateCourseProgressLocal(courseId, totalParts)
      setProgressPercent(percent)
    },
    [courseId, totalParts]
  )

  // Update video progress
  const updateVideoProgressFn = useCallback(
    (partId: string, watchTime: number, watchPercent: number): void => {
      updateVideoProgressLocal(courseId, partId, watchTime, watchPercent, videoCompletionThreshold)

      // Refresh state
      const courseProgress = getCourseProgress(courseId)
      setProgress(courseProgress)

      const percent = calculateCourseProgressLocal(courseId, totalParts)
      setProgressPercent(percent)
    },
    [courseId, totalParts, videoCompletionThreshold]
  )

  // Record quiz attempt
  const recordQuizAttemptFn = useCallback(
    (quizId: string, attempt: Omit<LocalStorageQuizAttempt, 'quizId'>): void => {
      recordQuizAttemptLocal(courseId, quizId, attempt)

      // Refresh state
      const courseProgress = getCourseProgress(courseId)
      setProgress(courseProgress)
    },
    [courseId]
  )

  // Get quiz attempts
  const getQuizAttemptsFn = useCallback(
    (quizId: string): LocalStorageQuizAttempt[] => {
      return getQuizAttemptsLocal(courseId, quizId)
    },
    [courseId]
  )

  // Check if quiz is passed
  const isQuizPassedFn = useCallback(
    (quizId: string): boolean => {
      return isQuizPassedLocal(courseId, quizId)
    },
    [courseId]
  )

  return {
    anonymousId,
    progress,
    progressPercent,
    getPartProgress: getPartProgressFn,
    isPartCompleted: isPartCompletedFn,
    getNextUncompletedPart: getNextUncompletedPartFn,
    markPartComplete: markPartCompleteFn,
    updateVideoProgress: updateVideoProgressFn,
    recordQuizAttempt: recordQuizAttemptFn,
    getQuizAttempts: getQuizAttemptsFn,
    isQuizPassed: isQuizPassedFn,
    isLoaded,
  }
}
