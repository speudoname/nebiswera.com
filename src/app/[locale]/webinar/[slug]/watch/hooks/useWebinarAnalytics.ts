/**
 * useWebinarAnalytics Hook
 *
 * Tracks webinar session analytics:
 * - SESSION_JOINED when video becomes visible
 * - SESSION_EXITED when user leaves (beforeunload/pagehide)
 */

'use client'

import { useEffect, useRef } from 'react'

interface UseWebinarAnalyticsParams {
  slug: string
  accessToken: string
  showWaitingRoom: boolean
  playbackMode: 'simulated_live' | 'replay'
  sessionType: string
  currentTime: number
  progress: number
  videoEnded: boolean
  sessionStartsAt?: Date
}

export function useWebinarAnalytics({
  slug,
  accessToken,
  showWaitingRoom,
  playbackMode,
  sessionType,
  currentTime,
  progress,
  videoEnded,
  sessionStartsAt,
}: UseWebinarAnalyticsParams) {
  const hasTrackedJoin = useRef(false)
  const hasTrackedExit = useRef(false)
  const sessionJoinTime = useRef<Date>(new Date())

  // Track session join when video becomes visible
  useEffect(() => {
    if (!showWaitingRoom && !hasTrackedJoin.current) {
      hasTrackedJoin.current = true

      const now = new Date()
      // Simplified SESSION_JOINED metadata - only essential info
      const metadata: Record<string, unknown> = {
        joinTime: now.toISOString(),
        playbackMode,
        sessionType,
      }

      // Track session join (ATTENDANCE event type)
      fetch(`/api/webinars/${slug}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          eventType: 'ATTENDANCE',
          metadata,
        }),
      }).catch((error) => {
        console.error('Failed to track session join:', error)
      })
    }
  }, [showWaitingRoom, slug, accessToken, playbackMode, sessionType, sessionStartsAt])

  // Track exit patterns - beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasTrackedExit.current) return
      hasTrackedExit.current = true

      const now = new Date()
      const sessionDurationSeconds = Math.floor((now.getTime() - sessionJoinTime.current.getTime()) / 1000)

      // Simplified SESSION_EXITED metadata - no bounce/earlyExit calculations
      const exitMetadata: Record<string, unknown> = {
        exitTime: now.toISOString(),
        sessionDurationSeconds,
        currentVideoPosition: currentTime,
        watchProgress: progress,
        completed: videoEnded,
      }

      // Use sendBeacon for reliability on page unload (LEFT_EARLY event type)
      const data = {
        token: accessToken,
        eventType: 'LEFT_EARLY',
        metadata: exitMetadata,
      }

      // Try sendBeacon first (more reliable for unload events)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/webinars/${slug}/analytics`, blob)
      } else {
        // Fallback to sync fetch
        fetch(`/api/webinars/${slug}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {})
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
    }
  }, [slug, accessToken, currentTime, progress, videoEnded])
}
