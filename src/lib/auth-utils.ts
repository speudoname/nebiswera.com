import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

const cookieName = process.env.NODE_ENV === 'production'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token'

export async function getAuthToken(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  })
}

export async function isAdmin(request: NextRequest) {
  const token = await getAuthToken(request)
  return token?.role === 'ADMIN'
}
