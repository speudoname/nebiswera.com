'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PixelEventName, PageType, PixelEventParams, UserData } from '@/lib/pixel/types'
import { generateEventId } from '@/lib/pixel/utils'

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
    trackEvent,
    trackPageView,
    trackViewContent,
    trackLead,
    trackCompleteRegistration,
  }
}
