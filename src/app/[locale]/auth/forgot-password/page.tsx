'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { KeyRound, Mail, ArrowLeft } from 'lucide-react'
import { Button, Input } from '@/components/ui'
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-secondary-100 text-secondary-600 shadow-neu-sm mb-4">
          <Mail className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-4">{t('success')}</h1>
        <Link href={`/${locale}/auth/login`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToLogin')}
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 text-primary-600 shadow-neu-sm mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-text-secondary mt-2">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-primary-100 rounded-neu shadow-neu-inset-sm text-primary-700 text-sm">
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

        <Button type="submit" className="w-full" loading={loading} loadingText={common('loading')}>
          {t('submit')}
        </Button>
      </form>

      <p className="mt-8 text-center">
        <Link href={`/${locale}/auth/login`} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t('backToLogin')}
        </Link>
      </p>
    </Card>
  )
}
