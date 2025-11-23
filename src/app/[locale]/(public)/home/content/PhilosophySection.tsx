'use client'

import { useLocale } from 'next-intl'
import { Compass, PenTool, Sparkles } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  title: string
  subtitle: string
  steps: Array<{
    title: string
    description: string
  }>
}> = {
  ka: {
    title: 'როგორ მუშაობს',
    subtitle: 'სამი ნაბიჯი შენი ბედის შესაცვლელად',
    steps: [
      {
        title: 'გაიცანი შენი თავი',
        description: 'აღმოაჩინე შენი ნამდვილი სურვილები და შესაძლებლობები. გაიგე, რა გაკავებს და რა გაძლიერებს.',
      },
      {
        title: 'აირჩიე შენი გზა',
        description: 'შეგნებულად განსაზღვრე, რა გინდა მიაღწიო. შენი არჩევანი — შენი მომავლის საფუძველია.',
      },
      {
        title: 'დაწერე შენი ბედი',
        description: 'გარდაქმენი აზრები მოქმედებად. ყოველი ნაბიჯი გაახლოებს შენს მიზანთან.',
      },
    ],
  },
  en: {
    title: 'How It Works',
    subtitle: 'Three steps to transform your fate',
    steps: [
      {
        title: 'Know Yourself',
        description: 'Discover your true desires and capabilities. Understand what holds you back and what empowers you.',
      },
      {
        title: 'Choose Your Path',
        description: 'Consciously define what you want to achieve. Your choice is the foundation of your future.',
      },
      {
        title: 'Write Your Fate',
        description: 'Transform thoughts into action. Every step brings you closer to your goal.',
      },
    ],
  },
}

const icons = [Compass, PenTool, Sparkles]

export function PhilosophySection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section id="learn-more" className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {t.title}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {t.steps.map((step, index) => {
            const Icon = icons[index]
            return (
              <div
                key={index}
                className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu text-center"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-primary-600" />
                </div>
                <div className="text-sm font-medium text-primary-600 mb-2">
                  {locale === 'ka' ? `ნაბიჯი ${index + 1}` : `Step ${index + 1}`}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
