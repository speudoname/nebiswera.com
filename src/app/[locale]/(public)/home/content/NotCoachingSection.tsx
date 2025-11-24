'use client'

import { useLocale } from 'next-intl'
import { BookOpen, Palette, Lightbulb } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  analogyTitle: string
  analogy: string
  principles: Array<{
    icon: 'book' | 'palette' | 'lightbulb'
    title: string
    description: string
  }>
  coreMessage: string
}> = {
  ka: {
    eyebrow: 'რა არ არის ნებისწერა',
    title: 'ნებისწერა არ არის კოუჩინგი',
    analogyTitle: 'ვასწავლით, როგორც ხატვის მასწავლებელი',
    analogy: 'როგორც ხატვის მასწავლებელი გასწავლით პერსპექტივის წესებს, ჩრდილებსა და შუქს, როგორ გამოიყენოთ ფანქარი და როგორ შეუხამოთ ფერები — ჩვენც ვასწავლით როგორ დაწეროთ ბედი ნებით.',
    principles: [
      {
        icon: 'book',
        title: 'სწავლება, არა ხელმძღვანელობა',
        description: 'ჩვენ ვასწავლით პრინციპებს და ფორმულებს, არ გეუბნებით როგორ იცხოვროთ',
      },
      {
        icon: 'palette',
        title: 'ინსტრუმენტები, არა მითითებები',
        description: 'გაძლევთ ხელსაწყოებს, თქვენ თავად წყვეტთ როგორ გამოიყენოთ',
      },
      {
        icon: 'lightbulb',
        title: 'არჩევანი თქვენია',
        description: 'არ გადაგიზავთ, არ გეუბნებით "უნდა გააკეთო ესა თუ ის" — ყველაფერი თქვენზეა',
      },
    ],
    coreMessage: 'ჩვენ ვასწავლით კანონებს და მეთოდებს. რას აირჩევთ მათთან — მხოლოდ თქვენზეა დამოკიდებული.',
  },
  en: {
    eyebrow: 'What Nebiswera is NOT',
    title: 'Nebiswera is NOT Coaching',
    analogyTitle: 'We teach, like a drawing teacher',
    analogy: 'Just as a drawing teacher teaches you the rules of perspective, shadows and light, how to use a pencil and match colors — we teach you how to write fate with will.',
    principles: [
      {
        icon: 'book',
        title: 'Teaching, Not Directing',
        description: 'We teach principles and formulas, we don\'t tell you how to live',
      },
      {
        icon: 'palette',
        title: 'Tools, Not Instructions',
        description: 'We give you the tools, you decide how to use them',
      },
      {
        icon: 'lightbulb',
        title: 'The Choice is Yours',
        description: 'We don\'t push you, don\'t tell you "you should do this or that" — everything is up to you',
      },
    ],
    coreMessage: 'We teach the laws and methods. What you choose to do with them is entirely up to you.',
  },
}

const iconMap = {
  book: BookOpen,
  palette: Palette,
  lightbulb: Lightbulb,
}

export function NotCoachingSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-14">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary">
            {t.title}
          </h2>
        </div>

        {/* Analogy Box */}
        <div className="bg-neu-base rounded-neu-lg p-8 md:p-10 shadow-neu mb-10 md:mb-12 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-primary-600 mb-4">
            {t.analogyTitle}
          </h3>
          <p className="text-base md:text-lg text-text-primary leading-relaxed max-w-2xl mx-auto">
            {t.analogy}
          </p>
        </div>

        {/* Principles Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
          {t.principles.map((principle, index) => {
            const Icon = iconMap[principle.icon]
            return (
              <div
                key={index}
                className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 md:mb-6 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                  <Icon className="w-7 h-7 text-primary-600" />
                </div>
                <h4 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                  {principle.title}
                </h4>
                <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                  {principle.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Core Message */}
        <div className="bg-gradient-to-r from-primary-100 to-primary-50 rounded-neu-lg p-6 md:p-8 shadow-neu-md text-center">
          <p className="text-base md:text-lg text-text-primary font-medium leading-relaxed">
            {t.coreMessage}
          </p>
        </div>
      </div>
    </section>
  )
}
