'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'

function AuthErrorContent() {
  const t = useTranslations('auth.errors')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return t('configuration')
      case 'AccessDenied':
        return t('accessDenied')
      case 'Verification':
        return t('verification')
      default:
        return t('defaultError')
    }
  }

  return (
    <Card className="w-full max-w-md text-center" padding="lg">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-neu bg-primary-100 text-primary-600 shadow-neu-sm mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-semibold text-text-primary mb-2">{t('authError')}</h1>
      <p className="text-text-secondary mb-6">{getErrorMessage()}</p>
      <Link href={`/${locale}/auth/login`}>
        <Button>{t('backToLogin')}</Button>
      </Link>
    </Card>
  )
}

export default function AuthErrorPage() {
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
      <AuthErrorContent />
    </Suspense>
  )
}
