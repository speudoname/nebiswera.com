'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { UserPlus } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Card } from '@/components/ui/Card'

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const errors = useTranslations('auth.errors')
  const common = useTranslations('common')
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
    <Card className="w-full max-w-md" padding="lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 text-primary-600 shadow-neu-sm mb-4">
          <UserPlus className="w-7 h-7" />
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

        <Button type="submit" fullWidth loading={loading} loadingText={common('loading')}>
          {t('submit')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        {t('hasAccount')}{' '}
        <Link href={`/${locale}/auth/login`} className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
          {t('signIn')}
        </Link>
      </p>
    </Card>
  )
}
