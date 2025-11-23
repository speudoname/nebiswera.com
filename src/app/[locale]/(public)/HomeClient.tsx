'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ArrowRight, BookOpen } from 'lucide-react'

export function HomeClient() {
  const t = useTranslations('home')
  const locale = useLocale()

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center p-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          <span className="text-text-primary">{t('titlePart1')}</span>
          <span className="text-primary-600"> — </span>
          <span className="text-primary-600">{t('titlePart2')}</span>
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary mb-8">
          {t('subtitle')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={`/${locale}/auth/register`}>
            <Button size="lg" rightIcon={ArrowRight}>
              {t('getStarted')}
            </Button>
          </Link>
          <Link href="#learn-more">
            <Button variant="outline" size="lg" leftIcon={BookOpen}>
              {t('learnMore')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
