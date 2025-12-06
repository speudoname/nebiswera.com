'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { usePageAnalytics } from '@/hooks/usePageAnalytics'

interface AnalyticsContextValue {
  trackEvent: (
    eventType: string,
    data?: {
      elementId?: string
      elementText?: string
      targetUrl?: string
      metadata?: Record<string, unknown>
    }
  ) => Promise<void>
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

interface AnalyticsProviderProps {
  children: ReactNode
  userId?: string | null
  pageId?: string
  enabled?: boolean
}

export function AnalyticsProvider({
  children,
  userId,
  pageId,
  enabled = true,
}: AnalyticsProviderProps) {
  const { trackEvent } = usePageAnalytics({ userId, pageId, enabled })

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)

  // Return a no-op if used outside provider
  if (!context) {
    return {
      trackEvent: async () => {},
    }
  }

  return context
}
