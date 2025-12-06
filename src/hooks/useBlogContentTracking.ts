'use client'

import { useEffect, useRef } from 'react'
import { useAnalytics } from '@/providers/AnalyticsProvider'

interface UseBlogContentTrackingOptions {
  contentSelector?: string
  blogPostId: string
}

/**
 * Tracks link clicks and other interactions within blog content
 * Uses event delegation for efficiency
 */
export function useBlogContentTracking({
  contentSelector = '.prose',
  blogPostId,
}: UseBlogContentTrackingOptions) {
  const { trackEvent } = useAnalytics()
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Find the content container
    const container = document.querySelector(contentSelector)
    if (!container) return

    containerRef.current = container as HTMLElement

    const handleClick = async (e: Event) => {
      const target = e.target as HTMLElement

      // Find the closest anchor tag
      const link = target.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href) return

      // Determine link type
      const isExternal = href.startsWith('http') && !href.includes(window.location.hostname)
      const isInternal = href.startsWith('/') || href.includes(window.location.hostname)
      const isAnchor = href.startsWith('#')

      // Get link text
      const linkText = link.textContent?.trim().substring(0, 100) || ''

      // Track the click
      await trackEvent('LINK_CLICK', {
        elementId: link.id || undefined,
        elementText: linkText,
        targetUrl: href,
        metadata: {
          blogPostId,
          linkType: isExternal ? 'external' : isInternal ? 'internal' : isAnchor ? 'anchor' : 'other',
          linkPosition: getLinkPosition(link, container as HTMLElement),
        },
      })
    }

    // Handle CTA button clicks
    const handleButtonClick = async (e: Event) => {
      const target = e.target as HTMLElement
      const button = target.closest('button')
      if (!button) return

      await trackEvent('BUTTON_CLICK', {
        elementId: button.id || undefined,
        elementText: button.textContent?.trim().substring(0, 100) || '',
        metadata: {
          blogPostId,
        },
      })
    }

    container.addEventListener('click', handleClick)
    container.addEventListener('click', handleButtonClick)

    return () => {
      container.removeEventListener('click', handleClick)
      container.removeEventListener('click', handleButtonClick)
    }
  }, [contentSelector, blogPostId, trackEvent])

  return containerRef
}

/**
 * Determine where in the content the link is positioned
 */
function getLinkPosition(link: HTMLElement, container: HTMLElement): string {
  const containerRect = container.getBoundingClientRect()
  const linkRect = link.getBoundingClientRect()

  const relativePosition = (linkRect.top - containerRect.top) / containerRect.height

  if (relativePosition < 0.33) return 'top'
  if (relativePosition < 0.66) return 'middle'
  return 'bottom'
}
