import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { JWT } from 'next-auth/jwt'
import type { Locale } from '@/i18n/config'
import { VERIFY_REQUIRED_PATH, VERIFICATION_GRACE_PERIOD_HOURS } from './constants'

interface VerificationCheckOptions {
  request: NextRequest
  token: JWT | null
  locale: string
  pathnameWithoutLocale: string
}

/**
 * Handles email verification enforcement:
 * - Users have a grace period after registration
 * - After grace period expires, unverified users are redirected to verify-required page
 */
export function handleEmailVerification({
  request,
  token,
  locale,
  pathnameWithoutLocale,
}: VerificationCheckOptions): NextResponse | null {
  if (!token) {
    return null
  }

  // Don't redirect if already on verify-required page
  if (pathnameWithoutLocale === VERIFY_REQUIRED_PATH) {
    return null
  }

  const { emailVerified, emailVerificationSentAt } = token

  // Skip if already verified or verification email was never sent
  if (emailVerified || !emailVerificationSentAt) {
    return null
  }

  const sentAt = new Date(emailVerificationSentAt as unknown as string)
  const hoursSinceSent = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60)

  // Grace period expired - redirect to verify-required page
  if (hoursSinceSent > VERIFICATION_GRACE_PERIOD_HOURS) {
    const userPreferredLocale = token.preferredLocale as Locale | undefined
    const targetLocale = userPreferredLocale || locale
    return NextResponse.redirect(
      new URL(`/${targetLocale}${VERIFY_REQUIRED_PATH}`, request.url)
    )
  }

  return null
}
