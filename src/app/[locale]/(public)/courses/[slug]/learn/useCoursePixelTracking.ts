/**
 * useCoursePixelTracking Hook
 *
 * Tracks Facebook Pixel events for LMS course player:
 * - CourseStarted: when the first lesson is viewed
 * - LessonStarted: when navigating to a new lesson part
 * - LessonCompleted: when a part is marked complete
 * - CourseCompleted: when course progress reaches 100%
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePixel } from '@/hooks/usePixel'

interface UseCoursePixelTrackingParams {
  courseId: string
  courseTitle: string
  courseSlug: string
  currentPartId: string | null
  currentPartTitle: string | null
  currentLessonTitle: string | null
  progressPercent: number
  enabled?: boolean
}

export function useCoursePixelTracking({
  courseId,
  courseTitle,
  courseSlug,
  currentPartId,
  currentPartTitle,
  currentLessonTitle,
  progressPercent,
  enabled = true,
}: UseCoursePixelTrackingParams) {
  const { trackEvent } = usePixel({ pageType: 'lms-lesson', enabled })

  // Track flags to ensure events fire only once per session
  const hasTrackedCourseStarted = useRef(false)
  const hasTrackedCourseCompleted = useRef(false)
  const trackedParts = useRef<Set<string>>(new Set())
  const previousProgressRef = useRef(progressPercent)

  // Base params for all events
  const baseParams = {
    course_id: courseId,
    course_name: courseTitle,
    content_name: courseTitle,
    content_category: 'Course',
    content_type: 'course',
  }

  // Track CourseStarted on first part view
  useEffect(() => {
    if (!enabled || !currentPartId || hasTrackedCourseStarted.current) return

    hasTrackedCourseStarted.current = true
    trackEvent({
      eventName: 'CourseStarted',
      params: {
        ...baseParams,
        lesson_id: currentPartId,
        lesson_name: currentPartTitle || undefined,
      },
    })
  }, [currentPartId, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track LessonStarted when part changes
  useEffect(() => {
    if (!enabled || !currentPartId) return

    // Skip if we've already tracked this part
    if (trackedParts.current.has(currentPartId)) return

    trackedParts.current.add(currentPartId)
    trackEvent({
      eventName: 'LessonStarted',
      params: {
        ...baseParams,
        lesson_id: currentPartId,
        lesson_name: currentPartTitle || undefined,
        completion_percent: progressPercent,
      },
    })
  }, [currentPartId, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track CourseCompleted when progress reaches 100%
  useEffect(() => {
    if (!enabled || hasTrackedCourseCompleted.current) return

    // Only fire when progress transitions to 100%
    if (progressPercent >= 100 && previousProgressRef.current < 100) {
      hasTrackedCourseCompleted.current = true
      trackEvent({
        eventName: 'CourseCompleted',
        params: {
          ...baseParams,
          completion_percent: 100,
        },
      })
    }

    previousProgressRef.current = progressPercent
  }, [progressPercent, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Function to track LessonCompleted (called when part is marked complete)
  const trackLessonCompleted = useCallback(
    (partId: string, partTitle?: string) => {
      if (!enabled) return

      trackEvent({
        eventName: 'LessonCompleted',
        params: {
          ...baseParams,
          lesson_id: partId,
          lesson_name: partTitle,
          completion_percent: progressPercent,
        },
      })
    },
    [enabled, trackEvent, progressPercent] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Function to track QuizCompleted
  const trackQuizCompleted = useCallback(
    (quizId: string, quizTitle: string, passed: boolean, score: number) => {
      if (!enabled) return

      trackEvent({
        eventName: 'QuizCompleted',
        params: {
          ...baseParams,
          content_name: quizTitle,
          content_ids: [quizId],
          status: passed ? 'passed' : 'failed',
          value: score,
        },
      })
    },
    [enabled, trackEvent] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return {
    trackLessonCompleted,
    trackQuizCompleted,
  }
}
