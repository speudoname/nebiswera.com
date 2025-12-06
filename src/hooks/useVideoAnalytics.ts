'use client'

import { useRef, useEffect, useCallback } from 'react'

// Analytics tracking milestones (percent)
const MILESTONES = [10, 25, 50, 75, 90, 100]

type VideoEventType =
  | 'VIDEO_STARTED'
  | 'VIDEO_PROGRESS'
  | 'VIDEO_COMPLETED'
  | 'VIDEO_SEEKED'
  | 'VIDEO_PAUSED'
  | 'VIDEO_UNMUTED'

interface UseVideoAnalyticsOptions {
  bunnyVideoId: string
  source?: string // e.g., 'homepage_hero', 'blog_post', etc.
  trackOnlyFirstLoop?: boolean // For looping videos, only track first completion
}

/**
 * Hook to add video analytics tracking to any video element
 *
 * Usage:
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null)
 * const { trackEvent } = useVideoAnalytics(videoRef, {
 *   bunnyVideoId: 'your-video-id',
 *   source: 'homepage_hero',
 * })
 *
 * // Optionally track custom events:
 * trackEvent('VIDEO_UNMUTED')
 * ```
 */
export function useVideoAnalytics(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseVideoAnalyticsOptions
) {
  const { bunnyVideoId, source, trackOnlyFirstLoop = false } = options

  // Tracking state refs
  const hasStartedRef = useRef(false)
  const hasCompletedRef = useRef(false)
  const reachedMilestonesRef = useRef<Set<number>>(new Set())
  const lastSeekPositionRef = useRef(0)
  const sessionIdRef = useRef<string>('')

  // Generate session ID on mount
  useEffect(() => {
    sessionIdRef.current = `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }, [])

  // Track analytics event
  const trackEvent = useCallback(async (
    eventType: VideoEventType,
    data?: Record<string, unknown>
  ) => {
    const video = videoRef.current

    const eventData = {
      bunnyVideoId,
      position: video?.currentTime || 0,
      duration: video?.duration || 0,
      percent: video && video.duration > 0
        ? Math.round((video.currentTime / video.duration) * 100)
        : 0,
      sessionId: sessionIdRef.current,
      source,
      ...data,
    }

    try {
      await fetch('/api/video-analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          ...eventData,
        }),
      })
    } catch (error) {
      // Silently fail - don't break the video experience
      console.error('Failed to track video event:', error)
    }
  }, [bunnyVideoId, source, videoRef])

  // Attach event listeners to video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true
        trackEvent('VIDEO_STARTED')
      }
    }

    const handlePause = () => {
      // Only track if video is not at the end
      if (video.currentTime < video.duration - 0.5) {
        trackEvent('VIDEO_PAUSED')
      }
    }

    const handleTimeUpdate = () => {
      // Skip milestone tracking if we've completed and trackOnlyFirstLoop is true
      if (trackOnlyFirstLoop && hasCompletedRef.current) return

      const duration = video.duration
      if (duration > 0) {
        const percent = Math.round((video.currentTime / duration) * 100)

        for (const milestone of MILESTONES) {
          if (percent >= milestone && !reachedMilestonesRef.current.has(milestone)) {
            reachedMilestonesRef.current.add(milestone)
            trackEvent('VIDEO_PROGRESS', { milestone, percent })
          }
        }
      }
    }

    const handleEnded = () => {
      if (trackOnlyFirstLoop && hasCompletedRef.current) return

      hasCompletedRef.current = true
      trackEvent('VIDEO_COMPLETED')
    }

    const handleSeeking = () => {
      lastSeekPositionRef.current = video.currentTime
    }

    const handleSeeked = () => {
      const fromPosition = lastSeekPositionRef.current
      const toPosition = video.currentTime
      // Only track significant seeks (> 2 seconds)
      if (Math.abs(toPosition - fromPosition) > 2) {
        trackEvent('VIDEO_SEEKED', { fromPosition, toPosition })
      }
    }

    // Add event listeners
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [trackEvent, trackOnlyFirstLoop, videoRef])

  return { trackEvent }
}
