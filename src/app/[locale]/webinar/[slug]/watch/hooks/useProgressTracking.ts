/**
 * useProgressTracking Hook
 *
 * Manages video progress tracking and server updates
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { TIMING } from '@/lib/webinar/constants'

interface UseProgressTrackingParams {
  slug: string
  accessToken: string
  videoEnded: boolean
}

interface UseProgressTrackingResult {
  currentTime: number
  progress: number
  handleTimeUpdate: (time: number, progressPercent: number) => void
  updateProgress: (progressPercent: number, position: number) => Promise<void>
}

export function useProgressTracking({
  slug,
  accessToken,
  videoEnded,
}: UseProgressTrackingParams): UseProgressTrackingResult {
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const lastProgressUpdate = useRef(0)

  // Update progress on server
  const updateProgress = useCallback(async (progressPercent: number, position: number) => {
    try {
      await fetch(`/api/webinars/${slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          progress: progressPercent,
          position,
          eventType: 'VIDEO_HEARTBEAT',
        }),
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }, [slug, accessToken])

  // Handle time updates from player
  const handleTimeUpdate = useCallback((time: number, progressPercent: number) => {
    setCurrentTime(time)
    setProgress(progressPercent)

    // Update watch progress on server at regular intervals (but not if video has ended)
    // Note: WebinarPlayer already has jitter built-in, so updates are distributed across users
    if (!videoEnded && Math.abs(time - lastProgressUpdate.current) >= TIMING.PROGRESS_UPDATE_INTERVAL_SECONDS) {
      lastProgressUpdate.current = time
      updateProgress(progressPercent, time)
    }
  }, [videoEnded, updateProgress])

  return {
    currentTime,
    progress,
    handleTimeUpdate,
    updateProgress,
  }
}
