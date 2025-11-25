import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from '@/i18n/config'

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

export function handleLocaleRedirect(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (pathname === '/') {
        const storedLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined
        const targetLocale = storedLocale && locales.includes(storedLocale) ? storedLocale : defaultLocale
        return NextResponse.redirect(new URL(`/${targetLocale}`, request.url))
    }

    return null
}
