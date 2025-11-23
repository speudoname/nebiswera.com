'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { LogIn, Loader2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Card } from '@/components/ui/Card'

function LoginContent() {
  const t = useTranslations('auth.login')
  const errors = useTranslations('auth.errors')
  const common = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || `/${locale}/dashboard`
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        callbackUrl,
        redirect: true,
      })
    } catch (err) {
      console.error('SignIn exception:', err)
      setError(errors('invalidCredentials'))
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 text-primary-600 shadow-neu-sm mb-4">
          <LogIn className="w-7 h-7" />
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
          value={formData.email}
          onChange={handleChange}
          required
        />

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

        <div className="flex items-center justify-end">
          <Link href={`/${locale}/auth/forgot-password`} className="text-body-sm">
            {t('forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading} loadingText={common('loading')}>
          {t('submit')}
        </Button>
      </form>

      <p className="mt-8 text-center text-body-sm text-secondary no-margin">
        {t('noAccount')}{' '}
        <Link href={`/${locale}/auth/register`} className="font-medium">
          {t('signUp')}
        </Link>
      </p>
    </Card>
  )
}

export default function LoginPage() {
  const common = useTranslations('common')

  return (
    <Suspense fallback={
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 shadow-neu-sm mx-auto mb-4">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
        <h3 className="no-margin">{common('loading')}</h3>
      </Card>
    }>
      <LoginContent />
    </Suspense>
  )
}
