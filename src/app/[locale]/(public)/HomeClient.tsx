'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ArrowRight, BookOpen } from 'lucide-react'

export function HomeClient() {
  const t = useTranslations('home')
  const locale = useLocale()

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="text-center py-8 md:py-12 max-w-3xl">
        <p className="eyebrow mb-3 md:mb-4">
          <span className="text-primary-600">{t('eyebrowStart')}</span>
          <span className="text-text-secondary"> {t('eyebrowEmphasis')} </span>
          <span className="text-primary-600">{t('eyebrowEnd')}</span>
        </p>
        <h1 className="hero-title mb-4 md:mb-6">
          <span className="text-text-primary">{t('titlePart1')}</span>
          <span className="text-primary-600"> — </span>
          <span className="text-primary-600">{t('titlePart2')}</span>
        </h1>
        <p className="hero-subtitle mb-6 md:mb-8">
          {t('subtitle')}
        </p>

        {/* Video Embed */}
        <div className="mb-6 md:mb-8 w-full max-w-2xl mx-auto rounded-neu shadow-neu overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full border-none"
              src="https://streamable.com/e/79h3le?autoplay=1&loop=0&nocontrols=1"
              allow="fullscreen;autoplay"
              allowFullScreen
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href={`/${locale}/auth/register`} className="w-full sm:w-auto">
            <Button size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto">
              {t('getStarted')}
            </Button>
          </Link>
          <Link href={`/${locale}/about`} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" leftIcon={BookOpen} className="w-full sm:w-auto">
              {t('learnMore')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
