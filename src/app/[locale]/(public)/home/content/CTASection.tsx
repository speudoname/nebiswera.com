'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  primaryCTA: string
  secondaryCTA: string
  urgency: string
}> = {
  ka: {
    eyebrow: 'დაიწყე დღეს',
    title: 'შენი ცხოვრება შენს ხელშია',
    subtitle: 'არ დაელოდო სრულყოფილ მომენტს. სრულყოფილი მომენტი არის ახლა.',
    primaryCTA: 'დაიწყე შენი გზა',
    secondaryCTA: 'გაიგე მეტი',
    urgency: 'ყოველი დღე გადადებული არის დღე დაკარგული',
  },
  en: {
    eyebrow: 'Start Today',
    title: 'Your Life Is in Your Hands',
    subtitle: 'Don\'t wait for the perfect moment. The perfect moment is now.',
    primaryCTA: 'Start Your Journey',
    secondaryCTA: 'Learn More',
    urgency: 'Every day delayed is a day lost',
  },
}

export function CTASection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700">
      <div className="max-w-4xl mx-auto text-center">
        {/* Decorative Element */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-neu-darkbg">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
        </div>

        {/* Header */}
        <p className="eyebrow text-white/90 mb-4">
          {t.eyebrow}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
          {t.title}
        </h2>
        <p className="text-lg md:text-2xl text-white/90 mb-8 md:mb-10 leading-relaxed">
          {t.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href={`/${locale}/auth/register`} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline-light"
              rightIcon={ArrowRight}
              className="w-full sm:w-auto bg-white text-text-primary hover:bg-white/90 shadow-neu-darkbg-hover"
            >
              {t.primaryCTA}
            </Button>
          </Link>
          <Link href={`/${locale}/about`} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto text-white border-2 border-white/30 hover:bg-white/10"
            >
              {t.secondaryCTA}
            </Button>
          </Link>
        </div>

        {/* Urgency Message */}
        <p className="text-sm md:text-base text-white/80 italic">
          {t.urgency}
        </p>
      </div>
    </section>
  )
}
