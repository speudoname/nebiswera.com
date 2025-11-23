'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { signOut, useSession } from 'next-auth/react'
import { Button, IconBadge } from '@/components/ui'
import { Card } from '@/components/ui/Card'

export function VerifyRequiredClient() {
  const t = useTranslations('auth.verifyRequired')
  const common = useTranslations('common')
  const errors = useTranslations('auth.errors')
  const locale = useLocale()
  const router = useRouter()
  const { update } = useSession()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleResend = async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        // Refresh the session to get updated emailVerificationSentAt
        await update()
        setStatus('success')
        // Redirect to dashboard after a brief moment
        setTimeout(() => {
          router.push(`/${locale}/dashboard`)
        }, 1500)
      } else {
        setStatus('error')
        setErrorMessage(data.error || errors('somethingWrong'))
      }
    } catch {
      setStatus('error')
      setErrorMessage(errors('somethingWrong'))
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: `/${locale}/auth/login` })
  }

  return (
    <Card className="w-full max-w-md text-center" padding="lg" darkBg>
      <div className="inline-flex mb-4">
        <IconBadge
          icon={status === 'success' ? 'CheckCircle' : 'Mail'}
          size="lg"
          variant={status === 'success' ? 'secondary' : 'primary'}
        />
      </div>

      {status === 'success' ? (
        <>
          <h3 className="mb-2">{t('emailSent')}</h3>
          <p className="text-secondary mb-6">{t('redirecting')}</p>
        </>
      ) : (
        <>
          <h3 className="mb-2">{t('title')}</h3>
          <p className="text-secondary mb-6">{t('description')}</p>

          {status === 'error' && (
            <div className="mb-4 p-3 rounded-neu bg-red-50 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleResend}
              loading={status === 'loading'}
              loadingText={common('loading')}
            >
              {t('resendButton')}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              {t('logoutButton')}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
