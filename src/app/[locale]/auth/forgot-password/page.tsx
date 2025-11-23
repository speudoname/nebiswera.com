'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { KeyRound, Mail, ArrowLeft } from 'lucide-react'
import { Button, Input, IconBadge } from '@/components/ui'
import { Card } from '@/components/ui/Card'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const common = useTranslations('common')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || t('success'))
      }
    } catch {
      setError(t('success'))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="inline-flex mb-4">
          <IconBadge icon={Mail} size="lg" variant="secondary" />
        </div>
        <h3 className="mb-4">{t('success')}</h3>
        <Link href={`/${locale}/auth/login`}>
          <Button variant="outline" leftIcon={ArrowLeft}>
            {t('backToLogin')}
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="text-center mb-8">
        <div className="inline-flex mb-4">
          <IconBadge icon={KeyRound} size="lg" variant="primary" />
        </div>
        <h2 className="no-margin">{t('title')}</h2>
        <p className="text-secondary mt-2 no-margin">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-primary-100 rounded-neu shadow-neu-inset-sm text-primary-700 text-body-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" fullWidth loading={loading} loadingText={common('loading')}>
          {t('submit')}
        </Button>
      </form>

      <p className="mt-8 text-center no-margin">
        <Link href={`/${locale}/auth/login`} className="text-body-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t('backToLogin')}
        </Link>
      </p>
    </Card>
  )
}
