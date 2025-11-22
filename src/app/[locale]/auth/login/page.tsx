'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Button, Input } from '@/components/ui'

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
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(errors('invalidCredentials'))
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError(errors('somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {t('submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('noAccount')}{' '}
        <Link href={`/${locale}/auth/register`} className="text-indigo-600 hover:text-indigo-500 font-medium">
          {t('signUp')}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  const common = useTranslations('common')

  return (
    <Suspense fallback={
      <div className="bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">{common('loading')}</h1>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
