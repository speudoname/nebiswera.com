'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'

interface EmailVerificationBannerProps {
  email: string
  verificationSentAt?: Date | null
}

export function EmailVerificationBanner({ email, verificationSentAt }: EmailVerificationBannerProps) {
  const t = useTranslations('dashboard')
  const common = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Calculate hours remaining
  const getHoursRemaining = () => {
    if (!verificationSentAt) return 24
    const sentTime = new Date(verificationSentAt).getTime()
    const expiresAt = sentTime + 24 * 60 * 60 * 1000
    const remaining = expiresAt - Date.now()
    return Math.max(0, Math.floor(remaining / (1000 * 60 * 60)))
  }

  const hoursRemaining = getHoursRemaining()

  const handleResend = async () => {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      })

      if (res.ok) {
        setMessage(t('emailSentSuccess'))
      } else {
        const data = await res.json()
        setMessage(data.error || t('emailSendFailed'))
      }
    } catch {
      setMessage(t('emailSendFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {t('verifyEmailTitle')}
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              {t('verifyEmailMessage', { email })}{' '}
              {hoursRemaining > 0 && t('hoursRemaining', { hours: hoursRemaining })}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              loading={loading}
              loadingText={common('loading')}
            >
              {t('resendEmail')}
            </Button>
            {message && (
              <span className="text-sm text-amber-700">{message}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
