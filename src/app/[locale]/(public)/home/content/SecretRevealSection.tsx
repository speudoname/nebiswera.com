'use client'

import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  secretBox: {
    title: string
    description: string
  }
}> = {
  ka: {
    eyebrow: 'საიდუმლო',
    title: 'ნებისწერა არის საიდუმლო',
    subtitle: 'არა იმიტომ რომ ვინმე მალავს, არამედ იმიტომ რომ ვერავინ ხედავს',
    secretBox: {
      title: 'ნებისწერა არის შინაგანი უნარი და ძალა',
      description: '99% ადამიანს ვერ ამჩნევს. ეს ძალა ყოველთვის შენთანაა, მაგრამ უმეტესობამ არ იცის როგორ გამოიყენოს.',
    },
  },
  en: {
    eyebrow: 'The Secret',
    title: 'Nebiswera is a Secret',
    subtitle: 'Not because someone hides it, but because no one sees it',
    secretBox: {
      title: 'Nebiswera is an Inner Ability and Power',
      description: '99% of people don\'t notice it. This power is always with you, but most don\'t know how to use it.',
    },
  },
}

export function SecretRevealSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section id="learn-more" className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-light">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {t.title}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary italic">
            {t.subtitle}
          </p>
        </div>

        {/* Central Secret Box */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md text-center">
          <h3 className="text-xl md:text-2xl font-bold text-primary-600 mb-4">
            {t.secretBox.title}
          </h3>
          <p className="text-base md:text-lg text-text-primary leading-relaxed max-w-2xl mx-auto">
            {t.secretBox.description}
          </p>
        </div>
      </div>
    </section>
  )
}
