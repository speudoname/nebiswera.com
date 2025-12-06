/**
 * useWebinarPixelTracking Hook
 *
 * Tracks Facebook Pixel events for webinar watch room:
 * - WebinarStarted: when video becomes visible (leaves waiting room)
 * - WebinarEngaged: at 50% watch progress
 * - WebinarCompleted: when video ends
 * - WebinarCTAClick: when user clicks a CTA interaction
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePixel } from '@/hooks/usePixel'

interface UseWebinarPixelTrackingParams {
  webinarId: string
  webinarTitle: string
  showWaitingRoom: boolean
  playbackMode: 'simulated_live' | 'on_demand' | 'replay'
  sessionType: string
  progress: number
  videoEnded: boolean
  enabled?: boolean
}

export function useWebinarPixelTracking({
  webinarId,
  webinarTitle,
  showWaitingRoom,
  playbackMode,
  sessionType,
  progress,
  videoEnded,
  enabled = true,
}: UseWebinarPixelTrackingParams) {
  const { trackEvent } = usePixel({ pageType: 'webinar-watch', enabled })

  // Track flags to ensure events fire only once
  const hasTrackedStarted = useRef(false)
  const hasTrackedEngaged = useRef(false)
  const hasTrackedCompleted = useRef(false)

  // Base params for all events
  const baseParams = {
    webinar_id: webinarId,
    webinar_name: webinarTitle,
    content_name: webinarTitle,
    content_category: 'Webinar',
    content_type: 'webinar',
    playback_mode: playbackMode,
    session_type: sessionType,
  }

  // Track WebinarStarted when video becomes visible
  useEffect(() => {
    if (!enabled || showWaitingRoom || hasTrackedStarted.current) return

    hasTrackedStarted.current = true
    trackEvent({
      eventName: 'WebinarStarted',
      params: {
        ...baseParams,
      },
    })
  }, [showWaitingRoom, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track WebinarEngaged at 50% progress
  useEffect(() => {
    if (!enabled || hasTrackedEngaged.current || progress < 50) return

    hasTrackedEngaged.current = true
    trackEvent({
      eventName: 'WebinarEngaged',
      params: {
        ...baseParams,
        completion_percent: Math.round(progress),
      },
    })
  }, [progress, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track WebinarCompleted when video ends
  useEffect(() => {
    if (!enabled || !videoEnded || hasTrackedCompleted.current) return

    hasTrackedCompleted.current = true
    trackEvent({
      eventName: 'WebinarCompleted',
      params: {
        ...baseParams,
        completion_percent: 100,
      },
    })
  }, [videoEnded, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Function to track CTA clicks (called from InteractionOverlay)
  const trackCTAClick = useCallback(
    (ctaType: string, ctaText?: string) => {
      if (!enabled) return

      trackEvent({
        eventName: 'WebinarCTAClick',
        params: {
          ...baseParams,
          cta_type: ctaType,
          cta_text: ctaText,
          completion_percent: Math.round(progress),
        },
      })
    },
    [enabled, trackEvent, progress] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return {
    trackCTAClick,
  }
}
