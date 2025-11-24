'use client'

import { useLocale } from 'next-intl'
import { Sparkles, Brain, Target, User } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  mainMessage: string
  contrast: {
    notTitle: string
    notItems: string[]
    isTitle: string
    isItems: string[]
  }
  coreMessage: string
}> = {
  ka: {
    eyebrow: 'რა არ არის ნებისწერა',
    title: 'ნებისწერა არ არის ჯადოსნური ხსნარი',
    mainMessage: 'არა მანტრები, არა ვიბრაციები, არა მისტიკური გზები. ნებისწერა არის ლოგიკური და რაციონალური მიდგომა.',
    contrast: {
      notTitle: 'რა არ არის',
      notItems: [
        'მანტრების ან რიტუალების თქმა',
        'ვიბრაციების ამაღლება',
        'ეზოთერული პრაქტიკები',
        'ჯადოსნური პროცედურა, რომელსაც ჩაიძახებ',
      ],
      isTitle: 'რა არის',
      isItems: [
        'ლოგიკური და რაციონალური მიდგომა',
        'ცხოვრება დამოკიდებულია შენზე',
        'შენ ხდები მთავარი, არა ჯადო',
        'შენი არჩევანია რაც მნიშვნელოვანია',
      ],
    },
    coreMessage: 'შენ აძლევ ძალას საკუთარ თავს — არა გარეგანი პროცედურები შენთვის. გაძლიერება მოდის გაგებიდან, არა ეზოთერიკიდან.',
  },
  en: {
    eyebrow: 'What Nebiswera is NOT',
    title: 'Nebiswera is NOT a Magical Solution',
    mainMessage: 'No mantras, no vibrations, no mystical shortcuts. Nebiswera is a logical and rational approach.',
    contrast: {
      notTitle: 'What it\'s NOT',
      notItems: [
        'Chanting mantras or rituals',
        'Raising vibrations',
        'Esoteric practices',
        'Magical procedure you call upon',
      ],
      isTitle: 'What it IS',
      isItems: [
        'Logical and rational approach',
        'Life depends on YOU',
        'YOU become in charge, not magic',
        'Your choice is what matters',
      ],
    },
    coreMessage: 'You empower yourself — not external procedures for you. Empowerment comes from understanding, not esotericism.',
  },
}

export function NotMagicSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-14">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-6">
            {t.title}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            {t.mainMessage}
          </p>
        </div>

        {/* Contrast Grid */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-14">
          {/* What it's NOT */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-neu bg-neu-light flex items-center justify-center shadow-neu-inset">
                <Sparkles className="w-6 h-6 text-primary-600 opacity-30 line-through" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary">
                {t.contrast.notTitle}
              </h3>
            </div>
            <ul className="space-y-3">
              {t.contrast.notItems.map((item, index) => (
                <li
                  key={index}
                  className="bg-neu-light rounded-neu p-4 shadow-neu-inset flex items-center gap-3"
                >
                  <span className="text-primary-600 text-xl">✗</span>
                  <span className="text-text-secondary text-sm md:text-base line-through">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* What it IS */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-neu bg-primary-100 flex items-center justify-center shadow-neu-sm">
                <Brain className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary">
                {t.contrast.isTitle}
              </h3>
            </div>
            <ul className="space-y-3">
              {t.contrast.isItems.map((item, index) => (
                <li
                  key={index}
                  className="bg-neu-base rounded-neu p-4 shadow-neu flex items-center gap-3"
                >
                  <span className="text-primary-600 text-xl font-bold">✓</span>
                  <span className="text-text-primary text-sm md:text-base font-medium">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Core Message */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg text-center">
          <div className="flex justify-center mb-4">
            <User className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>
          <p className="text-base md:text-lg text-white font-medium leading-relaxed max-w-2xl mx-auto">
            {t.coreMessage}
          </p>
        </div>
      </div>
    </section>
  )
}
