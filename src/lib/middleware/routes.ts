import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { JWT } from 'next-auth/jwt'
import type { Locale } from '@/i18n/config'
import { PROTECTED_PATHS, AUTH_PATHS } from './constants'

interface RouteProtectionOptions {
  request: NextRequest
  token: JWT | null
  locale: string
  pathnameWithoutLocale: string
}

/**
 * Handles route protection:
 * - Redirects unauthenticated users away from protected routes
 * - Redirects authenticated users away from auth routes
 */
export function handleRouteProtection({
  request,
  token,
  locale,
  pathnameWithoutLocale,
}: RouteProtectionOptions): NextResponse | null {
  const isLoggedIn = !!token
  const userPreferredLocale = token?.preferredLocale as Locale | undefined
  const { pathname } = request.nextUrl

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path)
  )
  const isAuthPath = AUTH_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path)
  )

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

  return null
}
