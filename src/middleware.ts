import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { AUTH_COOKIE_NAME } from '@/lib/auth/utils'
import {
  handleAdminRoutes,
  handleRouteProtection,
  handleEmailVerification,
  handleLocaleRedirect,
  LOCALE_COOKIE_NAME,
  LOCALE_PATTERN,
  LOCALE_EXTRACT_PATTERN,
} from '@/lib/middleware'

// Create the internationalization middleware (singleton)
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

/**
 * Extracts pathname without locale prefix
 * Uses pre-compiled regex for performance
 */
function getPathnameWithoutLocale(pathname: string): string {
  return pathname.replace(LOCALE_PATTERN, '') || '/'
}

/**
 * Extracts locale from pathname
 * Uses pre-compiled regex for performance
 */
function getLocaleFromPathname(pathname: string): Locale | null {
  const match = pathname.match(LOCALE_EXTRACT_PATTERN)
  return match ? (match[1] as Locale) : null
}

/**
 * Main middleware function
 *
 * Flow:
 * 1. Admin routes (/admin/*) - handled separately with their own auth
 * 2. Blog post routes (/blog/*) - no locale prefix, slug determines language
 * 3. Root redirect (/) - redirect to preferred locale
 * 4. Locale detection - ensure URL has locale prefix
 * 5. Auth token retrieval - for route protection
 * 6. Route protection - redirect unauthenticated users from protected routes
 * 7. Email verification - enforce verification after grace period
 * 8. Locale preference - redirect to user's preferred locale if different
 * 9. i18n middleware - handle remaining locale logic
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Handle admin routes (separate auth flow, no i18n)
  if (pathname.startsWith('/admin')) {
    const adminResponse = await handleAdminRoutes(request)
    return adminResponse ?? NextResponse.next()
  }

  // 2. Handle blog post routes (no locale prefix - slug determines language)
  if (pathname.startsWith('/blog/')) {
    return NextResponse.next()
  }

  // 3. Handle root redirect to preferred locale
  const rootRedirect = handleLocaleRedirect(request)
  if (rootRedirect) return rootRedirect

  // 4. Get locale from pathname
  const locale = getLocaleFromPathname(pathname)

  // If no locale in pathname, let intl middleware handle the redirect
  if (!locale) {
    return intlMiddleware(request)
  }

  // 5. Get auth token (with error handling)
  let token = null
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: AUTH_COOKIE_NAME,
    })
  } catch (error) {
    console.error('[Middleware] Auth token error:', error)
    // Continue without token - protected routes will redirect to login
  }

  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)
  const isLoggedIn = !!token
  const userPreferredLocale = token?.preferredLocale as Locale | undefined

  // For anonymous users, check cookie for stored locale preference
  const storedLocale = !isLoggedIn
    ? (request.cookies.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined)
    : undefined
  const effectivePreferredLocale = userPreferredLocale || storedLocale

  // 6. Route Protection
  const protectionRedirect = handleRouteProtection({
    request,
    token,
    locale,
    pathnameWithoutLocale,
  })
  if (protectionRedirect) return protectionRedirect

  // 7. Email Verification
  const verificationRedirect = handleEmailVerification({
    request,
    token,
    locale,
    pathnameWithoutLocale,
  })
  if (verificationRedirect) return verificationRedirect

  // 8. Preferred Locale Redirect
  // Redirect users to their preferred locale if different from current URL
  if (
    effectivePreferredLocale &&
    locale !== effectivePreferredLocale &&
    locales.includes(effectivePreferredLocale)
  ) {
    const newUrl = new URL(request.url)
    newUrl.pathname = pathname.replace(`/${locale}`, `/${effectivePreferredLocale}`)
    return NextResponse.redirect(newUrl)
  }

  // 9. Final: i18n Middleware
  return intlMiddleware(request)
}

/**
 * Matcher configuration
 * Excludes static assets and API routes at the config level for performance
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.ico|.*\\.webmanifest).*)',
  ],
}
