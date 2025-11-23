'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Button, IconBadge } from '@/components/ui'
import { Card } from '@/components/ui/Card'

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail')
  const errors = useTranslations('auth.errors')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { status: sessionStatus, update } = useSession()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('errorMessage'))
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (res.ok) {
          if (sessionStatus === 'authenticated') {
            await update()
          }
          setStatus('success')
          setMessage(t('successMessage'))
        } else {
          setStatus('error')
          setMessage(data.error || t('errorMessage'))
        }
      } catch {
        setStatus('error')
        setMessage(errors('somethingWrong'))
      }
    }

    verifyEmail()
  }, [token, t, errors, sessionStatus, update])

  return (
    <Card className="w-full max-w-md text-center" padding="lg" darkBg>
      {status === 'loading' && (
        <>
          <div className="inline-flex mb-4">
            <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
          </div>
          <h3 className="no-margin">{t('verifying')}</h3>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="inline-flex mb-4">
            <IconBadge icon="CheckCircle" size="lg" variant="secondary" />
          </div>
          <h3 className="mb-2">{t('success')}</h3>
          <p className="text-secondary mb-6">{message}</p>
          <Link href={`/${locale}/dashboard`}>
            <Button>{t('goToDashboard')}</Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="inline-flex mb-4">
            <IconBadge icon="XCircle" size="lg" variant="danger" />
          </div>
          <h3 className="mb-2">{t('error')}</h3>
          <p className="text-secondary mb-6">{message}</p>
          <Link href={`/${locale}/auth/login`}>
            <Button variant="outline">{t('resendLink')}</Button>
          </Link>
        </>
      )}
    </Card>
  )
}

export function VerifyEmailClient() {
  const common = useTranslations('common')

  return (
    <Suspense fallback={
      <Card className="w-full max-w-md text-center" padding="lg" darkBg>
        <div className="inline-flex mb-4">
          <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
        </div>
        <h3 className="no-margin">{common('loading')}</h3>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
