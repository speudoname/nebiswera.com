'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Button, IconBadge } from '@/components/ui'
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
      <div className="inline-flex mb-4">
        <IconBadge icon="AlertTriangle" size="lg" variant="danger" />
      </div>
      <h3 className="mb-2">{t('authError')}</h3>
      <p className="text-secondary mb-6">{getErrorMessage()}</p>
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
        <div className="inline-flex mb-4">
          <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
        </div>
        <h3 className="no-margin">{common('loading')}</h3>
      </Card>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
