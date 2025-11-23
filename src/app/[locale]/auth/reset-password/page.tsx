'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { KeyRound, XCircle, Loader2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
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
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 text-primary-600 shadow-neu-sm mb-4">
          <XCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-4">{t('invalidToken')}</h1>
        <Link href={`/${locale}/auth/forgot-password`}>
          <Button>{t('submit')}</Button>
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
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 shadow-neu-sm mx-auto mb-4">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary">{common('loading')}</h1>
      </Card>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
