import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Centralized cookie configuration - used by auth.ts and middleware.ts
export const AUTH_COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token'

export async function getAuthToken(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: AUTH_COOKIE_NAME,
  })
}

export async function isAdmin(request: NextRequest) {
  const token = await getAuthToken(request)
  return token?.role === 'ADMIN'
}
