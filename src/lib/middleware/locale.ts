import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { LOCALE_COOKIE_NAME } from './constants'

/**
 * Handles root path redirect to user's preferred locale
 */
export function handleLocaleRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  if (pathname !== '/') {
    return null
  }

  const storedLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined
  const targetLocale = storedLocale && locales.includes(storedLocale) ? storedLocale : defaultLocale

  return NextResponse.redirect(new URL(`/${targetLocale}`, request.url))
}
