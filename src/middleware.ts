import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { AUTH_COOKIE_NAME } from '@/lib/auth-utils'

// Cookie name for storing user's locale preference (set by client)
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

// Paths that should be excluded from locale handling
const publicPaths = ['/api', '/_next', '/favicon.ico', '/admin']

function getPathnameWithoutLocale(pathname: string): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})`)
  return pathname.replace(localePattern, '') || '/'
}

function getLocaleFromPathname(pathname: string): string | null {
  const match = pathname.match(new RegExp(`^/(${locales.join('|')})`))
  return match ? match[1] : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip locale handling for API routes, static files, and admin panel
  const shouldSkipIntl = publicPaths.some((path) => pathname.startsWith(path))

  // Handle admin routes separately (English only, no locale prefix)
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: AUTH_COOKIE_NAME,
    })

    if (!token) {
      const loginUrl = new URL(`/${defaultLocale}/auth/login`, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${defaultLocale}/dashboard`, request.url))
    }
    return NextResponse.next()
  }

  // Handle root redirect - check for stored locale preference
  if (pathname === '/') {
    const storedLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined
    const targetLocale = storedLocale && locales.includes(storedLocale) ? storedLocale : defaultLocale
    return NextResponse.redirect(new URL(`/${targetLocale}`, request.url))
  }

  // For API routes, skip intl middleware
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Get the locale from pathname
  const locale = getLocaleFromPathname(pathname)

  // If no locale in pathname, let intl middleware handle the redirect
  if (!locale) {
    return intlMiddleware(request)
  }

  // Get the path without locale for checking protected/auth routes
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)

  // Get the token for auth checks
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: AUTH_COOKIE_NAME,
  })

  const isLoggedIn = !!token
  const userPreferredLocale = token?.preferredLocale as Locale | undefined

  // For anonymous users, check cookie for stored preference
  const storedLocale = !isLoggedIn
    ? (request.cookies.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined)
    : undefined
  const effectivePreferredLocale = userPreferredLocale || storedLocale

  // Protected routes (dashboard, profile)
  const protectedPaths = ['/dashboard', '/profile']
  const isProtectedPath = protectedPaths.some((path) =>
    pathnameWithoutLocale.startsWith(path)
  )

  // Auth routes (login, register, etc.)
  const authPaths = ['/auth/login', '/auth/register']
  const isAuthPath = authPaths.some((path) => pathnameWithoutLocale.startsWith(path))

  // Verify-required page
  const isVerifyRequiredPath = pathnameWithoutLocale === '/auth/verify-required'

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedPath && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthPath && isLoggedIn) {
    const targetLocale = userPreferredLocale || locale
    return NextResponse.redirect(new URL(`/${targetLocale}/dashboard`, request.url))
  }

  // Check email verification grace period for logged-in users
  if (isLoggedIn && !isVerifyRequiredPath) {
    const emailVerified = token?.emailVerified
    const emailVerificationSentAt = token?.emailVerificationSentAt

    // If not verified and verification was sent
    if (!emailVerified && emailVerificationSentAt) {
      const sentAt = new Date(emailVerificationSentAt as unknown as string)
      const hoursSinceSent = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60)

      // Grace period expired (24 hours) - redirect to verify-required page
      if (hoursSinceSent > 24) {
        const targetLocale = userPreferredLocale || locale
        return NextResponse.redirect(new URL(`/${targetLocale}/auth/verify-required`, request.url))
      }
    }
  }

  // Redirect users to their preferred locale if different from current URL
  // This works for both logged-in users (from JWT) and anonymous users (from cookie)
  if (effectivePreferredLocale && locale !== effectivePreferredLocale && locales.includes(effectivePreferredLocale)) {
    const newUrl = new URL(request.url)
    newUrl.pathname = pathname.replace(`/${locale}`, `/${effectivePreferredLocale}`)
    return NextResponse.redirect(newUrl)
  }

  // Let intl middleware handle the response (sets locale cookie, etc.)
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.ico|.*\\.webmanifest).*)'],
}
