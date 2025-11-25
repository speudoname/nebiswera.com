import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { AUTH_COOKIE_NAME } from '@/lib/auth/utils'
import { handleAdminRoutes } from '@/lib/middleware/admin'
import { handleRouteProtection } from '@/lib/middleware/routes'
import { handleEmailVerification } from '@/lib/middleware/verification'
import { handleLocaleRedirect } from '@/lib/middleware/locale'

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

  // 1. Skip locale handling for API routes, static files, and admin panel
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // 2. Handle admin routes separately
    const adminResponse = await handleAdminRoutes(request)
    if (adminResponse) return adminResponse

    // For other public paths (api, static), continue
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }
  }

  // 3. Handle root redirect
  const rootRedirect = handleLocaleRedirect(request)
  if (rootRedirect) return rootRedirect

  // 4. Get locale
  const locale = getLocaleFromPathname(pathname)

  // If no locale in pathname, let intl middleware handle the redirect
  if (!locale) {
    return intlMiddleware(request)
  }

  // 5. Get auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: AUTH_COOKIE_NAME,
  })

  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)
  const userPreferredLocale = token?.preferredLocale as Locale | undefined

  // For anonymous users, check cookie for stored preference
  const isLoggedIn = !!token
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
  if (effectivePreferredLocale && locale !== effectivePreferredLocale && locales.includes(effectivePreferredLocale)) {
    const newUrl = new URL(request.url)
    newUrl.pathname = pathname.replace(`/${locale}`, `/${effectivePreferredLocale}`)
    return NextResponse.redirect(newUrl)
  }

  // 9. Final: Intl Middleware
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.ico|.*\\.webmanifest).*)'],
}
