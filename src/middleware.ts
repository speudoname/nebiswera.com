import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

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
      cookieName: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
    })

    const isLoggedIn = !!token
    const isAdmin = token?.role === 'ADMIN'

    if (!isLoggedIn) {
      const loginUrl = new URL(`/${defaultLocale}/auth/login`, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${defaultLocale}/dashboard`, request.url))
    }
    return NextResponse.next()
  }

  // Handle root redirect to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
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
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  })

  console.log('[MIDDLEWARE] Path:', pathnameWithoutLocale, 'Token:', token ? 'exists' : 'null')

  const isLoggedIn = !!token

  // Protected routes (dashboard, profile)
  const protectedPaths = ['/dashboard', '/profile']
  const isProtectedPath = protectedPaths.some((path) =>
    pathnameWithoutLocale.startsWith(path)
  )

  // Auth routes (login, register, etc.)
  const authPaths = ['/auth/login', '/auth/register']
  const isAuthPath = authPaths.some((path) => pathnameWithoutLocale.startsWith(path))

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedPath && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  // Let intl middleware handle the response (sets locale cookie, etc.)
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.ico|.*\\.webmanifest).*)'],
}
