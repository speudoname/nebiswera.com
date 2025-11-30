import { locales } from '@/i18n/config'

// Cookie name for storing user's locale preference
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

// Pre-compiled regex patterns for performance (avoid creating new RegExp on every request)
export const LOCALE_PATTERN = new RegExp(`^/(${locales.join('|')})`)
export const LOCALE_EXTRACT_PATTERN = new RegExp(`^/(${locales.join('|')})(?=/|$)`)

// Route definitions
export const PROTECTED_PATHS = ['/dashboard', '/profile'] as const
export const AUTH_PATHS = ['/auth/login', '/auth/register'] as const
export const VERIFY_REQUIRED_PATH = '/auth/verify-required'

// Email verification grace period in hours
export const VERIFICATION_GRACE_PERIOD_HOURS = 24
