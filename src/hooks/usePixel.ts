'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import type { PixelEventName, PageType, PixelEventParams, UserData } from '@/lib/pixel/types'
import { generateEventId } from '@/lib/pixel/utils'

// Module-level flags to prevent duplicate listeners across hook instances
let consentListenerAdded = false
let consentCheckInterval: ReturnType<typeof setInterval> | null = null
let consentListeners: Set<(consent: boolean) => void> = new Set()

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

/**
 * Setup global consent listener (singleton pattern)
 * Only one listener is added regardless of how many hook instances exist
 */
function setupConsentListener(callback: (consent: boolean) => void) {
  consentListeners.add(callback)

  if (!consentListenerAdded) {
    consentListenerAdded = true

    // Notify all listeners when consent changes
    const notifyListeners = () => {
      const consent = hasTrackingConsent()
      consentListeners.forEach((cb) => cb(consent))
    }

    // Listen for storage events (some consent managers use this)
    window.addEventListener('storage', notifyListeners)

    // Check periodically (reduced from 2s to 10s to minimize overhead)
    consentCheckInterval = setInterval(notifyListeners, 10000)
  }

  // Return cleanup function
  return () => {
    consentListeners.delete(callback)
  }
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
  const [hasConsent, setHasConsent] = useState(() => hasTrackingConsent())

  // Track if component is mounted (for async operations)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Setup consent listener (singleton - only one global listener)
  useEffect(() => {
    const cleanup = setupConsentListener((consent) => {
      if (isMountedRef.current) {
        setHasConsent(consent)
      }
    })
    return cleanup
  }, [])

  // Check if pixel is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      setIsReady(true)
      return
    }

    // Listen for pixel load with 500ms interval (10 checks max over 5 seconds)
    const checkPixel = setInterval(() => {
      if (window.fbq) {
        setIsReady(true)
        clearInterval(checkPixel)
      }
    }, 500)

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
        if (data.pixelEnabled && isMountedRef.current) {
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

      // Check for user consent before tracking (re-check at tracking time)
      const currentConsent = hasTrackingConsent()
      if (!currentConsent) {
        console.debug('[Pixel] Tracking skipped - no user consent')
        return
      }

      const finalEventId = eventId || generateEventId(eventName)
      const { fbp, fbc } = getCookies()

      // Capture URL immediately to ensure browser and server events use the same URL
      const currentPageUrl = window.location.href

      // Debug log for event ID verification (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Pixel] Tracking ${eventName} with eventId: ${finalEventId}`)
      }

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

      // Server-side tracking (Conversions API) with simple retry
      const sendToServer = async (attempt: number = 1): Promise<void> => {
        try {
          const response = await fetch('/api/pixel/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventName,
              eventId: finalEventId,
              pageType,
              pageUrl: currentPageUrl, // Use captured URL to ensure consistency with browser event
              params,
              userData,
              fbp,
              fbc,
            }),
          })

          if (!response.ok && attempt < 2) {
            // Retry once on failure
            console.warn(`[Pixel] Server tracking failed (attempt ${attempt}), retrying...`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return sendToServer(attempt + 1)
          }
        } catch (error) {
          if (attempt < 2) {
            console.warn(`[Pixel] Server tracking error (attempt ${attempt}), retrying...`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return sendToServer(attempt + 1)
          }
          console.error('[Pixel] Server tracking failed after retry:', error)
        }
      }

      // Fire server tracking without blocking
      sendToServer()
    },
    [enabled, isReady, pageType, getCookies]
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
    async (params?: PixelEventParams, userData?: UserData, eventId?: string) => {
      await trackEvent({ eventName: 'Lead', params, userData, eventId })
    },
    [trackEvent]
  )

  // Track CompleteRegistration
  const trackCompleteRegistration = useCallback(
    async (params?: PixelEventParams, userData?: UserData, eventId?: string) => {
      await trackEvent({ eventName: 'CompleteRegistration', params, userData, eventId })
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
