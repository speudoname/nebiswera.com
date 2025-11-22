'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Button, Input } from '@/components/ui'

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const errors = useTranslations('auth.errors')
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError(errors('passwordMismatch'))
      return
    }

    if (formData.password.length < 8) {
      setError(t('passwordRequirements'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          locale,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error === 'Email already registered' ? errors('emailInUse') : data.error || errors('somethingWrong'))
        setLoading(false)
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        router.push(`/${locale}/auth/login`)
      } else {
        router.push(`/${locale}/dashboard`)
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
          id="name"
          name="name"
          type="text"
          label={t('name')}
          placeholder={t('namePlaceholder')}
          value={formData.name}
          onChange={handleChange}
        />

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

        <Button type="submit" className="w-full" loading={loading}>
          {t('submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('hasAccount')}{' '}
        <Link href={`/${locale}/auth/login`} className="text-indigo-600 hover:text-indigo-500 font-medium">
          {t('signIn')}
        </Link>
      </p>
    </div>
  )
}
