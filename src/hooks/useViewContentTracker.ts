'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePixel } from './usePixel'
import type { PageType, PixelEventParams } from '@/lib/pixel/types'
import { DEFAULT_VIEW_CONTENT_CONFIG } from '@/lib/pixel/types'

interface UseViewContentTrackerOptions {
  pageType: PageType
  contentParams?: PixelEventParams
  enabled?: boolean
  // Override default thresholds
  scrollThreshold?: number
  timeThresholdSeconds?: number
  // For blog posts, provide reading time to calculate time threshold
  readingTimeMinutes?: number
}

/**
 * Hook to track ViewContent event based on scroll and time thresholds
 * Triggers once when thresholds are met
 */
export function useViewContentTracker({
  pageType,
  contentParams,
  enabled = true,
  scrollThreshold: customScrollThreshold,
  timeThresholdSeconds: customTimeThreshold,
  readingTimeMinutes,
}: UseViewContentTrackerOptions) {
  const { trackViewContent } = usePixel({ pageType, enabled })
  const [hasTracked, setHasTracked] = useState(false)
  const [scrollPercent, setScrollPercent] = useState(0)
  const [timeOnPage, setTimeOnPage] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  // Get config for this page type
  const config = DEFAULT_VIEW_CONTENT_CONFIG[pageType]

  // Calculate thresholds
  const scrollThreshold = customScrollThreshold ?? config.scrollThreshold
  let timeThreshold = customTimeThreshold ?? config.timeThresholdSeconds

  // For blog posts, calculate time threshold as 70% of reading time
  if (pageType === 'blog' && readingTimeMinutes) {
    timeThreshold = Math.round(readingTimeMinutes * 60 * 0.7) // 70% of reading time in seconds
  }

  const requireBoth = config.requireBoth

  // Track scroll position
  const updateScrollPercent = useCallback(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) {
      setScrollPercent(1)
      return
    }
    const scrolled = window.scrollY / docHeight
    setScrollPercent(Math.min(scrolled, 1))
  }, [])

  // Check if thresholds are met and track
  const checkAndTrack = useCallback(() => {
    if (hasTracked || !enabled) return

    const scrollMet = scrollPercent >= scrollThreshold
    const timeMet = timeOnPage >= timeThreshold

    let shouldTrack = false

    if (requireBoth) {
      // Both conditions must be met
      shouldTrack = scrollMet && timeMet
    } else {
      // Either condition is sufficient (OR logic)
      if (scrollThreshold > 0 && timeThreshold > 0) {
        shouldTrack = scrollMet || timeMet
      } else if (scrollThreshold > 0) {
        shouldTrack = scrollMet
      } else if (timeThreshold > 0) {
        shouldTrack = timeMet
      }
    }

    if (shouldTrack) {
      setHasTracked(true)
      trackViewContent({
        ...contentParams,
        scroll_depth: Math.round(scrollPercent * 100),
        time_on_page: timeOnPage,
      })
    }
  }, [
    hasTracked,
    enabled,
    scrollPercent,
    scrollThreshold,
    timeOnPage,
    timeThreshold,
    requireBoth,
    trackViewContent,
    contentParams,
  ])

  // Set up scroll listener
  useEffect(() => {
    if (!enabled || hasTracked) return

    // Initial check
    updateScrollPercent()

    window.addEventListener('scroll', updateScrollPercent, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrollPercent)
    }
  }, [enabled, hasTracked, updateScrollPercent])

  // Set up time tracker
  useEffect(() => {
    if (!enabled || hasTracked) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setTimeOnPage(elapsed)
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [enabled, hasTracked])

  // Check thresholds on changes
  useEffect(() => {
    checkAndTrack()
  }, [checkAndTrack])

  return {
    hasTracked,
    scrollPercent: Math.round(scrollPercent * 100),
    timeOnPage,
    scrollThreshold: Math.round(scrollThreshold * 100),
    timeThreshold,
  }
}
