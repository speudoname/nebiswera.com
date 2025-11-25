import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { defaultLocale } from '@/i18n/config'
import { AUTH_COOKIE_NAME } from '@/lib/auth/utils'

export async function handleAdminRoutes(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (!pathname.startsWith('/admin')) {
        return null
    }

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
