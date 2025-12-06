'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

// Cookie utilities
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

// Generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
}

// Get or create session/visitor IDs
function getSessionId(): string {
  let sessionId = getCookie('_nbs_sid')
  if (!sessionId) {
    sessionId = generateId('sess')
    setCookie('_nbs_sid', sessionId, 1 / 24) // 1 hour session
  }
  return sessionId
}

function getVisitorId(): string {
  let visitorId = getCookie('_nbs_vid')
  if (!visitorId) {
    visitorId = generateId('vis')
    setCookie('_nbs_vid', visitorId, 365) // 1 year
  }
  return visitorId
}

interface UsePageAnalyticsOptions {
  pageId?: string // For specific resources like blog posts
  userId?: string | null
  enabled?: boolean
}

export function usePageAnalytics(options: UsePageAnalyticsOptions = {}) {
  const { pageId, userId, enabled = true } = options
  const pathname = usePathname()

  // Refs to track state without triggering re-renders
  const pageViewIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const maxScrollRef = useRef<number>(0)
  const hasEngagedRef = useRef<boolean>(false)
  const hasBouncedRef = useRef<boolean>(true)

  // Track scroll depth
  const updateScrollDepth = useCallback(() => {
    if (typeof window === 'undefined') return

    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight
    const winHeight = window.innerHeight
    const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100) || 0

    if (scrollPercent > maxScrollRef.current) {
      maxScrollRef.current = Math.min(scrollPercent, 100)
    }

    // Mark as engaged if scrolled past 25%
    if (maxScrollRef.current >= 25) {
      hasEngagedRef.current = true
      hasBouncedRef.current = false
    }
  }, [])

  // Send engagement update to server
  const sendEngagementUpdate = useCallback(async () => {
    if (!pageViewIdRef.current) return

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)

    // Mark as engaged if stayed more than 10 seconds
    if (duration >= 10) {
      hasEngagedRef.current = true
      hasBouncedRef.current = false
    }

    try {
      await fetch('/api/analytics/pageview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageViewIdRef.current,
          duration,
          scrollDepth: maxScrollRef.current,
          engaged: hasEngagedRef.current,
          bounced: hasBouncedRef.current,
        }),
        keepalive: true, // Important for beforeunload
      })
    } catch {
      // Silently fail - analytics shouldn't break the app
    }
  }, [])

  // Track page view
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Skip admin pages
    if (pathname.startsWith('/admin')) return

    // Reset state for new page
    pageViewIdRef.current = null
    startTimeRef.current = Date.now()
    maxScrollRef.current = 0
    hasEngagedRef.current = false
    hasBouncedRef.current = true

    const sessionId = getSessionId()
    const visitorId = getVisitorId()

    // Send initial page view
    const trackPageView = async () => {
      try {
        const response = await fetch('/api/analytics/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            pageId: pageId || null,
            referrer: document.referrer || null,
            sessionId,
            visitorId,
            userId: userId || null,
            fullUrl: window.location.href,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          pageViewIdRef.current = data.id
        }
      } catch {
        // Silently fail
      }
    }

    trackPageView()

    // Set up scroll tracking
    window.addEventListener('scroll', updateScrollDepth, { passive: true })

    // Set up visibility change handler (for tab switches)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendEngagementUpdate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Set up beforeunload handler
    const handleBeforeUnload = () => {
      sendEngagementUpdate()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Set up periodic update (every 30 seconds)
    const intervalId = setInterval(() => {
      sendEngagementUpdate()
    }, 30000)

    return () => {
      // Clean up and send final update
      window.removeEventListener('scroll', updateScrollDepth)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(intervalId)
      sendEngagementUpdate()
    }
  }, [pathname, pageId, userId, enabled, updateScrollDepth, sendEngagementUpdate])

  // Track events
  const trackEvent = useCallback(
    async (
      eventType: string,
      data?: { elementId?: string; elementText?: string; targetUrl?: string; metadata?: Record<string, unknown> }
    ) => {
      if (!enabled || !pageViewIdRef.current) return

      try {
        await fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageViewId: pageViewIdRef.current,
            eventType,
            ...data,
          }),
        })
      } catch {
        // Silently fail
      }
    },
    [enabled]
  )

  return { trackEvent }
}
