'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PixelEventName, PageType, PixelEventParams, UserData } from '@/lib/pixel/types'
import { generateEventId } from '@/lib/pixel/utils'

/**
 * Check if tracking consent has been given
 * Returns true if:
 * - cookie_consent cookie is "accepted", "true", or "1"
 * - No cookie_consent cookie exists (no consent mechanism = assume OK)
 * Returns false if:
 * - cookie_consent cookie exists with any other value (user denied)
 */
function hasTrackingConsent(): boolean {
  if (typeof document === 'undefined') return false

  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  const consent = cookies['cookie_consent']

  // No consent mechanism in place - assume tracking is OK
  if (consent === undefined) return true

  // Explicit consent given
  const acceptedValues = ['accepted', 'true', '1', 'all']
  return acceptedValues.includes(consent.toLowerCase())
}

// Extend Window interface for fbq
declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      params?: Record<string, unknown>
    ) => void
    _fbq?: unknown
  }
}

interface UsePixelOptions {
  pageType?: PageType
  enabled?: boolean
}

interface TrackEventOptions {
  eventName: PixelEventName
  params?: PixelEventParams
  userData?: UserData
  eventId?: string
}

/**
 * Hook for Facebook Pixel tracking
 * Handles both client-side (fbq) and server-side (Conversions API) tracking
 */
export function usePixel(options: UsePixelOptions = {}) {
  const { pageType = 'other', enabled = true } = options
  const [isReady, setIsReady] = useState(false)
  const [pixelId, setPixelId] = useState<string | null>(null)
  const [hasConsent, setHasConsent] = useState(false)

  // Check for tracking consent
  useEffect(() => {
    setHasConsent(hasTrackingConsent())

    // Re-check consent when cookies change (e.g., user accepts/rejects cookie banner)
    const checkConsent = () => setHasConsent(hasTrackingConsent())

    // Listen for storage events (some consent managers use this)
    window.addEventListener('storage', checkConsent)

    // Also check periodically in case consent cookie is set by external script
    const interval = setInterval(checkConsent, 2000)

    return () => {
      window.removeEventListener('storage', checkConsent)
      clearInterval(interval)
    }
  }, [])

  // Check if pixel is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      setIsReady(true)
    }

    // Listen for pixel load
    const checkPixel = setInterval(() => {
      if (window.fbq) {
        setIsReady(true)
        clearInterval(checkPixel)
      }
    }, 100)

    // Stop checking after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkPixel)
    }, 5000)

    return () => {
      clearInterval(checkPixel)
      clearTimeout(timeout)
    }
  }, [])

  // Fetch pixel ID for client-side tracking
  useEffect(() => {
    async function fetchPixelId() {
      try {
        const res = await fetch('/api/pixel/track', { method: 'GET' })
        const data = await res.json()
        if (data.pixelEnabled) {
          setPixelId(data.pixelId)
        }
      } catch (error) {
        console.error('[Pixel] Failed to fetch config:', error)
      }
    }

    if (enabled) {
      fetchPixelId()
    }
  }, [enabled])

  // Get fbp and fbc cookies
  const getCookies = useCallback(() => {
    if (typeof document === 'undefined') return { fbp: undefined, fbc: undefined }

    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    return {
      fbp: cookies._fbp,
      fbc: cookies._fbc,
    }
  }, [])

  // Track event (both client and server)
  const trackEvent = useCallback(
    async ({ eventName, params, userData, eventId }: TrackEventOptions) => {
      if (!enabled) return

      // Check for user consent before tracking
      if (!hasConsent) {
        console.debug('[Pixel] Tracking skipped - no user consent')
        return
      }

      const finalEventId = eventId || generateEventId(eventName)
      const { fbp, fbc } = getCookies()

      // Client-side tracking
      if (isReady && window.fbq) {
        try {
          const isCustomEvent = ![
            'PageView',
            'ViewContent',
            'Lead',
            'CompleteRegistration',
            'InitiateCheckout',
            'AddToCart',
            'Purchase',
            'Search',
            'AddPaymentInfo',
            'AddToWishlist',
            'Contact',
            'CustomizeProduct',
            'Donate',
            'FindLocation',
            'Schedule',
            'StartTrial',
            'SubmitApplication',
            'Subscribe',
          ].includes(eventName)

          const eventParams = {
            ...params,
            eventID: finalEventId,
          }

          if (isCustomEvent) {
            window.fbq('trackCustom', eventName, eventParams)
          } else {
            window.fbq('track', eventName, eventParams)
          }
        } catch (error) {
          console.error('[Pixel] Client tracking error:', error)
        }
      }

      // Server-side tracking (Conversions API)
      try {
        await fetch('/api/pixel/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName,
            eventId: finalEventId,
            pageType,
            pageUrl: window.location.href,
            params,
            userData,
            fbp,
            fbc,
          }),
        })
      } catch (error) {
        console.error('[Pixel] Server tracking error:', error)
      }
    },
    [enabled, isReady, hasConsent, pageType, getCookies]
  )

  // Track PageView
  const trackPageView = useCallback(
    async (params?: PixelEventParams) => {
      await trackEvent({ eventName: 'PageView', params })
    },
    [trackEvent]
  )

  // Track ViewContent
  const trackViewContent = useCallback(
    async (params?: PixelEventParams) => {
      await trackEvent({ eventName: 'ViewContent', params })
    },
    [trackEvent]
  )

  // Track Lead
  const trackLead = useCallback(
    async (params?: PixelEventParams, userData?: UserData) => {
      await trackEvent({ eventName: 'Lead', params, userData })
    },
    [trackEvent]
  )

  // Track CompleteRegistration
  const trackCompleteRegistration = useCallback(
    async (params?: PixelEventParams, userData?: UserData) => {
      await trackEvent({ eventName: 'CompleteRegistration', params, userData })
    },
    [trackEvent]
  )

  return {
    isReady,
    pixelId,
    hasConsent,
    trackEvent,
    trackPageView,
    trackViewContent,
    trackLead,
    trackCompleteRegistration,
  }
}
