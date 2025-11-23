'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui'

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
    <div className="bg-white rounded-xl shadow-xl p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('authError')}</h1>
      <p className="text-gray-600 mb-6">{getErrorMessage()}</p>
      <Link href={`/${locale}/auth/login`}>
        <Button>{t('backToLogin')}</Button>
      </Link>
    </div>
  )
}

export default function AuthErrorPage() {
  const common = useTranslations('common')

  return (
    <Suspense fallback={
      <div className="bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">{common('loading')}</h1>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
