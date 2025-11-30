import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { defaultLocale } from '@/i18n/config'
import { AUTH_COOKIE_NAME } from '@/lib/auth/utils'

/**
 * Handles admin route protection:
 * - Requires authentication
 * - Requires ADMIN role
 * - Redirects to login if not authenticated
 * - Redirects to dashboard if authenticated but not admin
 */
export async function handleAdminRoutes(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return null
  }

  try {
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
      return NextResponse.redirect(
        new URL(`/${defaultLocale}/dashboard`, request.url)
      )
    }

    return NextResponse.next()
  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error('[Middleware] Admin auth error:', error)
    // On auth error, redirect to login as a safe fallback
    const loginUrl = new URL(`/${defaultLocale}/auth/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }
}
