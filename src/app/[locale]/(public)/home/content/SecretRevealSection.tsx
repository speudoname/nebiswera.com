'use client'

import { useLocale } from 'next-intl'
import { Eye, EyeOff, Zap } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  secretBox: {
    title: string
    description: string
  }
  insights: Array<{
    icon: 'hidden' | 'visible' | 'power'
    title: string
    description: string
  }>
}> = {
  ka: {
    eyebrow: 'საიდუმლო',
    title: 'ნებისწერა არის საიდუმლო',
    subtitle: 'არა იმიტომ რომ ვინმე მალავს, არამედ იმიტომ რომ ვერავინ ხედავს',
    secretBox: {
      title: 'ნებისწერა არის შინაგანი უნარი და ძალა',
      description: '99% ადამიანს ვერ ამჩნევს. ეს ძალა ყოველთვის შენთანაა, მაგრამ უმეტესობამ არ იცის როგორ გამოიყენოს.',
    },
    insights: [
      {
        icon: 'hidden',
        title: 'უხილავი, მაგრამ რეალური',
        description: 'როგორც ჰაერი რომელიც არ ჩანს, მაგრამ გარეშე ვერ იარსებებ',
      },
      {
        icon: 'visible',
        title: 'შენში არსებული',
        description: 'არ არის რაღაც გარეგანი რაც უნდა იპოვო, შენში უკვე არსებობს',
      },
      {
        icon: 'power',
        title: 'უძლიერესი ძალა',
        description: 'ეს არის ის, რაც განსაზღვრავს შენს რეალობას და მომავალს',
      },
    ],
  },
  en: {
    eyebrow: 'The Secret',
    title: 'Nebiswera is a Secret',
    subtitle: 'Not because someone hides it, but because no one sees it',
    secretBox: {
      title: 'Nebiswera is an Inner Ability and Power',
      description: '99% of people don\'t notice it. This power is always with you, but most don\'t know how to use it.',
    },
    insights: [
      {
        icon: 'hidden',
        title: 'Invisible, Yet Real',
        description: 'Like the air you can\'t see, but can\'t exist without',
      },
      {
        icon: 'visible',
        title: 'Already Within You',
        description: 'It\'s not something external you need to find, it already exists within',
      },
      {
        icon: 'power',
        title: 'The Most Powerful Force',
        description: 'This is what determines your reality and your future',
      },
    ],
  },
}

const iconMap = {
  hidden: EyeOff,
  visible: Eye,
  power: Zap,
}

export function SecretRevealSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section id="learn-more" className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
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
        <div className="mb-12 md:mb-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md text-center">
          <h3 className="text-xl md:text-2xl font-bold text-primary-600 mb-4">
            {t.secretBox.title}
          </h3>
          <p className="text-base md:text-lg text-text-primary leading-relaxed max-w-2xl mx-auto">
            {t.secretBox.description}
          </p>
        </div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {t.insights.map((insight, index) => {
            const Icon = iconMap[insight.icon]
            return (
              <div
                key={index}
                className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu text-center"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-primary-600" />
                </div>
                <h4 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                  {insight.title}
                </h4>
                <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                  {insight.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
