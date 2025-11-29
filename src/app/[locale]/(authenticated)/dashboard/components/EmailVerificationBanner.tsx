'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'

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
    <div className="bg-primary-50 border border-primary-200 rounded-neu p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-primary-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-primary-800">
            {t('verifyEmailTitle')}
          </h3>
          <div className="mt-2 text-sm text-primary-700">
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
              <span className="text-sm text-primary-700">{message}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
