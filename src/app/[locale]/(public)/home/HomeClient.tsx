'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ArrowRight, BookOpen } from 'lucide-react'

export function HomeClient() {
  const t = useTranslations('home')
  const locale = useLocale()

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center py-4 md:py-6 max-w-3xl">
        <p className="eyebrow mb-4 md:mb-4">
          <span className="text-primary-600">{t('eyebrowStart')}</span>
          <span className="text-text-secondary"> {t('eyebrowEmphasis')} </span>
          <span className="text-primary-600">{t('eyebrowEnd')}</span>
        </p>
        <h1 className="hero-title mb-4 md:mb-6">
          <span className="text-text-primary">{t('titlePart1')}</span>
          <span className="text-primary-600"> — </span>
          <span className="text-primary-600">{t('titlePart2')}</span>
        </h1>
        <h2 className="hero-subtitle mb-6 md:mb-8">
          {t('subtitle')}
        </h2>

        {/* Video */}
        <div className="mb-6 md:mb-8 w-full max-w-xl mx-auto rounded-neu shadow-neu overflow-hidden aspect-video">
          <video
            className="w-full h-full object-cover"
            width={1280}
            height={720}
            autoPlay
            muted
            playsInline
            // @ts-expect-error - fetchPriority is valid but not in React types yet
            fetchPriority="high"
            poster="https://cdn.nebiswera.com/hero-video-poster.jpg"
          >
            <source src="https://cdn.nebiswera.com/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href={`/${locale}/auth/register`} className="w-full sm:w-auto">
            <Button size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto">
              {t('getStarted')}
            </Button>
          </Link>
          <a href="#learn-more" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" leftIcon={BookOpen} className="w-full sm:w-auto">
              {t('learnMore')}
            </Button>
          </a>
        </div>
      </div>
    </div>
    </section>
  )
}
