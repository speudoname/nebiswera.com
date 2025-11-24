'use client'

import { useTranslations } from 'next-intl'
import { Heart, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface Step5ThankYouProps {
  locale: string
}

export function Step5ThankYou({ locale }: Step5ThankYouProps) {
  const t = useTranslations('collectLove.step5')

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center shadow-neu-lg animate-pulse">
          <Heart className="w-12 h-12 text-white fill-white" />
        </div>

        <h2 className="text-4xl font-bold text-text-primary mb-4">
          {t('title')}
        </h2>

        <p className="text-lg text-text-secondary mb-2">
          {t('message')}
        </p>

        <p className="text-text-muted">
          {t('messageDetails')}
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <Link href={`/${locale}/love`}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
          >
            {t('viewTestimonials')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>

        <Link href={`/${locale}`}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
          >
            <Home className="w-5 h-5 mr-2" />
            {t('backHome')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
