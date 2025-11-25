'use client'

import { useLocale } from 'next-intl'
import { Sparkles, TrendingUp, Target, Shield } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  benefits: Array<{
    icon: 'sparkles' | 'trending' | 'target' | 'shield'
    title: string
    description: string
  }>
}> = {
  ka: {
    eyebrow: 'შენი არჩევანია',
    title: 'მზად ხარ დაიბრუნო ძალა, რომელიც არავის არასდროს წაურთმევია?',
    subtitle: 'მზად ხარ, რომ შენი ცხოვრება ისეთი გახადო, როგორც მოგეწონებოდა?',
    cta: 'ეს არის შენი შესაძლებლობა',
    benefits: [
      {
        icon: 'sparkles',
        title: 'აღმოაჩინო შენი ნამდვილი ძალა',
        description: 'გაიცნობ და გააქტიურებ შინაგან უნარს, რომელიც ყოველთვის შენთან იყო',
      },
      {
        icon: 'trending',
        title: 'შეცვალე შენი რეალობა',
        description: 'შეიძინე ცოდნა და ინსტრუმენტები, რომლებიც გარდაქმნიან შენს ცხოვრებას',
      },
      {
        icon: 'target',
        title: 'მიაღწიე შენს მიზნებს',
        description: 'დაამყარე კავშირი შენს ნებასა და მოქმედებებს შორის',
      },
      {
        icon: 'shield',
        title: 'იყავი თავისუფალი',
        description: 'აღარ იყო დამოკიდებული გარეგან ფაქტორებზე, შენ განსაზღვრავ შენს გზას',
      },
    ],
  },
  en: {
    eyebrow: 'It\'s Your Choice',
    title: 'Are You Ready to Reclaim the Power That Has Never Been Taken from Anyone?',
    subtitle: 'Are you ready to make your life exactly as you would like it?',
    cta: 'This is your opportunity',
    benefits: [
      {
        icon: 'sparkles',
        title: 'Discover Your True Power',
        description: 'Know and activate the inner ability that has always been with you',
      },
      {
        icon: 'trending',
        title: 'Change Your Reality',
        description: 'Acquire knowledge and tools that will transform your life',
      },
      {
        icon: 'target',
        title: 'Achieve Your Goals',
        description: 'Establish connection between your will and your actions',
      },
      {
        icon: 'shield',
        title: 'Be Free',
        description: 'No longer dependent on external factors, you determine your path',
      },
    ],
  },
}

const iconMap = {
  sparkles: Sparkles,
  trending: TrendingUp,
  target: Target,
  shield: Shield,
}

export function TransformationPromiseSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-base to-neu-light">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
            {t.title}
          </h2>
          <p className="text-xl md:text-2xl text-primary-600 font-semibold mb-6">
            {t.subtitle}
          </p>
          <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-neu-md shadow-neu-darkbg">
            <p className="text-base md:text-lg font-semibold">
              {t.cta}
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {t.benefits.map((benefit, index) => {
            const Icon = iconMap[benefit.icon]
            return (
              <div
                key={index}
                className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu hover:shadow-neu-hover transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-neu bg-primary-100 flex items-center justify-center shadow-neu-sm">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
