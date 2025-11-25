import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { JWT } from 'next-auth/jwt'
import type { Locale } from '@/i18n/config'

interface RouteProtectionOptions {
    request: NextRequest
    token: JWT | null
    locale: string
    pathnameWithoutLocale: string
}

export function handleRouteProtection({
    request,
    token,
    locale,
    pathnameWithoutLocale,
}: RouteProtectionOptions) {
    const isLoggedIn = !!token
    const userPreferredLocale = token?.preferredLocale as Locale | undefined
    const { pathname } = request.nextUrl

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
        const targetLocale = userPreferredLocale || locale
        return NextResponse.redirect(new URL(`/${targetLocale}/dashboard`, request.url))
    }

    return null
}
