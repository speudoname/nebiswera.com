import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { JWT } from 'next-auth/jwt'
import type { Locale } from '@/i18n/config'

interface VerificationCheckOptions {
    request: NextRequest
    token: JWT | null
    locale: string
    pathnameWithoutLocale: string
}

export function handleEmailVerification({
    request,
    token,
    locale,
    pathnameWithoutLocale,
}: VerificationCheckOptions) {
    const isLoggedIn = !!token
    const isVerifyRequiredPath = pathnameWithoutLocale === '/auth/verify-required'
    const userPreferredLocale = token?.preferredLocale as Locale | undefined

    if (isLoggedIn && !isVerifyRequiredPath) {
        const emailVerified = token?.emailVerified
        const emailVerificationSentAt = token?.emailVerificationSentAt

        // If not verified and verification was sent
        if (!emailVerified && emailVerificationSentAt) {
            const sentAt = new Date(emailVerificationSentAt as unknown as string)
            const hoursSinceSent = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60)

            // Grace period expired (24 hours) - redirect to verify-required page
            if (hoursSinceSent > 24) {
                const targetLocale = userPreferredLocale || locale
                return NextResponse.redirect(new URL(`/${targetLocale}/auth/verify-required`, request.url))
            }
        }
    }

    return null
}
