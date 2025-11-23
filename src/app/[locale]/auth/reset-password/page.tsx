'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Button, Input, IconBadge } from '@/components/ui'
import { Card } from '@/components/ui/Card'

function ResetPasswordContent() {
  const t = useTranslations('auth.resetPassword')
  const errors = useTranslations('auth.errors')
  const common = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError(t('invalidToken'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(errors('passwordMismatch'))
      return
    }

    if (formData.password.length < 8) {
      setError(errors('weakPassword'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/${locale}/auth/login`)
      } else {
        setError(data.error || errors('somethingWrong'))
      }
    } catch {
      setError(errors('somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md text-center" padding="lg" darkBg>
        <div className="inline-flex mb-4">
          <IconBadge icon="XCircle" size="lg" variant="danger" />
        </div>
        <h3 className="mb-4">{t('invalidToken')}</h3>
        <Link href={`/${locale}/auth/forgot-password`}>
          <Button>{t('submit')}</Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md" padding="lg" darkBg>
      <div className="text-center mb-8">
        <div className="inline-flex mb-4">
          <IconBadge icon="KeyRound" size="lg" variant="primary" />
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
          id="password"
          name="password"
          type="password"
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label={t('confirmPassword')}
          placeholder={t('passwordPlaceholder')}
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <Button type="submit" fullWidth loading={loading} loadingText={common('loading')}>
          {t('submit')}
        </Button>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  const common = useTranslations('common')

  return (
    <Suspense fallback={
      <Card className="w-full max-w-md text-center" padding="lg" darkBg>
        <div className="flex justify-center mb-4">
          <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
        </div>
        <h3 className="no-margin">{common('loading')}</h3>
      </Card>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
