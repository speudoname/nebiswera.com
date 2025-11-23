'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail')
  const errors = useTranslations('auth.errors')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
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
  }, [token, t, errors])

  return (
    <Card className="w-full max-w-md text-center" padding="lg">
      {status === 'loading' && (
        <>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 shadow-neu-sm mb-4">
            <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">{t('verifying')}</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-green-100 text-green-600 shadow-neu-sm mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">{t('success')}</h1>
          <p className="text-text-secondary mb-6">{message}</p>
          <Link href={`/${locale}/dashboard`}>
            <Button>{t('goToDashboard')}</Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-red-100 text-red-600 shadow-neu-sm mb-4">
            <XCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">{t('error')}</h1>
          <p className="text-text-secondary mb-6">{message}</p>
          <Link href={`/${locale}/auth/login`}>
            <Button variant="outline">{t('resendLink')}</Button>
          </Link>
        </>
      )}
    </Card>
  )
}

export default function VerifyEmailPage() {
  const common = useTranslations('common')

  return (
    <Suspense fallback={
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 shadow-neu-sm mb-4">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary">{common('loading')}</h1>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
