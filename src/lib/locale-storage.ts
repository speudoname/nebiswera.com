import { type Locale, locales, defaultLocale } from '@/i18n/config'

const LOCALE_STORAGE_KEY = 'preferred-locale'
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

/**
 * Get the stored locale from localStorage
 * Returns null if not set or invalid
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale
    }
  } catch {
    // localStorage might be blocked or unavailable
  }
  return null
}

/**
 * Save locale to localStorage and cookie (for middleware access)
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return

  try {
    // Save to localStorage for fast client-side access
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)

    // Also set a cookie so middleware can read it
    // Cookie expires in 1 year
    const maxAge = 60 * 60 * 24 * 365
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`
  } catch {
    // localStorage/cookie might be blocked or unavailable
  }
}

/**
 * Clear stored locale from localStorage and cookie
 */
export function clearStoredLocale(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`
  } catch {
    // localStorage/cookie might be blocked or unavailable
  }
}

/**
 * Get the effective locale for anonymous users
 * Priority: localStorage > default
 */
export function getEffectiveLocale(): Locale {
  return getStoredLocale() || defaultLocale
}
