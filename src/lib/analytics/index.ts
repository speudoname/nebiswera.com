/**
 * Analytics Utilities
 *
 * Helper functions for page view tracking and analytics
 */

import type { PageType, DeviceType } from '@prisma/client'

/**
 * Determine page type from URL path
 */
export function getPageTypeFromPath(path: string): PageType {
  // Remove locale prefix if present
  const cleanPath = path.replace(/^\/(ka|en)/, '') || '/'

  if (cleanPath === '/' || cleanPath === '') return 'HOME'
  if (cleanPath === '/blog') return 'BLOG_LIST'
  if (cleanPath.startsWith('/blog/')) return 'BLOG_POST'
  if (cleanPath.match(/^\/webinar\/[^/]+$/)) return 'WEBINAR_LANDING'
  if (cleanPath.match(/^\/webinar\/[^/]+\/watch/)) return 'WEBINAR_ROOM'
  if (cleanPath === '/courses') return 'COURSE_LIST'
  if (cleanPath.startsWith('/courses/')) return 'COURSE_PAGE'
  if (cleanPath === '/about') return 'ABOUT'
  if (cleanPath === '/contact') return 'CONTACT'
  if (cleanPath.startsWith('/auth/')) return 'AUTH'

  return 'OTHER'
}

/**
 * Extract locale from path
 */
export function getLocaleFromPath(path: string): string | null {
  const match = path.match(/^\/(ka|en)/)
  return match ? match[1] : null
}

/**
 * Determine device type from user agent
 */
export function getDeviceType(userAgent: string): DeviceType {
  if (!userAgent) return 'DESKTOP'

  const ua = userAgent.toLowerCase()

  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return 'MOBILE'
  }

  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'TABLET'
  }

  return 'DESKTOP'
}

/**
 * Parse browser info from user agent
 */
export function parseBrowserInfo(userAgent: string): { browser: string; version: string } {
  if (!userAgent) return { browser: 'Unknown', version: '' }

  const ua = userAgent

  // Chrome
  const chromeMatch = ua.match(/Chrome\/(\d+)/)
  if (chromeMatch && !ua.includes('Edg')) {
    return { browser: 'Chrome', version: chromeMatch[1] }
  }

  // Edge
  const edgeMatch = ua.match(/Edg\/(\d+)/)
  if (edgeMatch) {
    return { browser: 'Edge', version: edgeMatch[1] }
  }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+)/)
  if (firefoxMatch) {
    return { browser: 'Firefox', version: firefoxMatch[1] }
  }

  // Safari
  const safariMatch = ua.match(/Version\/(\d+).*Safari/)
  if (safariMatch) {
    return { browser: 'Safari', version: safariMatch[1] }
  }

  // Opera
  const operaMatch = ua.match(/OPR\/(\d+)/)
  if (operaMatch) {
    return { browser: 'Opera', version: operaMatch[1] }
  }

  return { browser: 'Other', version: '' }
}

/**
 * Parse OS from user agent
 */
export function parseOS(userAgent: string): string {
  if (!userAgent) return 'Unknown'

  const ua = userAgent

  if (ua.includes('Windows NT 10')) return 'Windows 10'
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1'
  if (ua.includes('Windows NT 6.2')) return 'Windows 8'
  if (ua.includes('Windows NT 6.1')) return 'Windows 7'
  if (ua.includes('Windows')) return 'Windows'

  if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/)
    return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS'
  }

  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Linux')) return 'Linux'

  return 'Unknown'
}

/**
 * Extract domain from referrer URL
 */
export function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null

  try {
    const url = new URL(referrer)
    return url.hostname
  } catch {
    return null
  }
}

/**
 * Parse UTM parameters from URL
 */
export function parseUTMParams(url: string): Record<string, string | null> {
  try {
    const urlObj = new URL(url)
    return {
      utmSource: urlObj.searchParams.get('utm_source'),
      utmMedium: urlObj.searchParams.get('utm_medium'),
      utmCampaign: urlObj.searchParams.get('utm_campaign'),
      utmContent: urlObj.searchParams.get('utm_content'),
      utmTerm: urlObj.searchParams.get('utm_term'),
    }
  } catch {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    }
  }
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Generate a random visitor ID
 */
export function generateVisitorId(): string {
  return `vis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`
}
