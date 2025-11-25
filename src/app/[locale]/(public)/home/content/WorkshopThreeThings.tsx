'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Brain, Target, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  pillarsTitle: string
  pillars: Array<{
    icon: 'brain' | 'target' | 'heart'
    title: string
    description: string
  }>
  transformationTitle: string
  transformationText: string
  cta: string
}> = {
  ka: {
    pillarsTitle: 'სამი რამ რაც ხდება ვორქშოფის დროს',
    pillars: [
      {
        icon: 'brain',
        title: 'ნებისწერის თეორემის შესწავლა',
        description: 'სწავლობთ ნებისწერის თეორემას, ყველა ფორმულას და ინსტრუმენტს. 81 კონცეფტი და 18+ ვარჯიში რომლებიც პრაქტიკულად გამოიყენებ.',
      },
      {
        icon: 'target',
        title: 'საკუთარ თავში ჩაღრმავება და გამორკვევა',
        description: 'ღრმად იმუშავებთ საკუთარ თავზე, აღმოაჩენთ 45 რამეს საკუთარ თავთან დაკავშირებით, გაიგებთ რა გაკავებთ და რა გაძლიერებთ.',
      },
      {
        icon: 'heart',
        title: 'გამოცდილებითი პროცესები',
        description: 'მედიტაციები, ტრანსი, თვითშემეცნების პროცესები და სხვა გამოცდილებითი პრაქტიკები რომლებიც ცვლის შენს ცნობიერებას.',
      },
    ],
    transformationTitle: 'შედეგი',
    transformationText: 'პარასკევს შემოდიხართ ერთი სამყაროდან, ორშაბათს უკვე სხვაში ხართ. თქვენი ცნობიერება ირთვება, ყურადღება მაღლა არის, სავსე ხართ ინსაიტებით, თვითრწმენით და ძალით შეცვალოთ თქვენი ცხოვრება.',
    cta: 'გამოცხადება',
  },
  en: {
    pillarsTitle: 'Three Things That Happen During the Workshop',
    pillars: [
      {
        icon: 'brain',
        title: 'Learning Nebiswera Theorem',
        description: 'You learn the Nebiswera theorem, all formulas and tools. 81 concepts and 18+ exercises you\'ll use practically.',
      },
      {
        icon: 'target',
        title: 'Deep Dive Into Yourself',
        description: 'You work deeply on yourself, discover 45 things about yourself, understand what holds you back and what empowers you.',
      },
      {
        icon: 'heart',
        title: 'Experiential Processes',
        description: 'Meditations, trance, self-exploration processes and other experiential practices that transform your consciousness.',
      },
    ],
    transformationTitle: 'The Transformation',
    transformationText: 'You enter Friday from one world, by Monday you\'re in another. Your consciousness turns on, attention sharpens, you\'re full of insights, self-confidence, and power to change your life.',
    cta: 'Apply for Next Workshop',
  },
}

const iconMap = {
  brain: Brain,
  target: Target,
  heart: Heart,
}

export function WorkshopThreeThings() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-primary-50 via-neu-base to-primary-50">
      <div className="max-w-6xl mx-auto">
        {/* Three Pillars */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-8 md:mb-10">
            {t.pillarsTitle}
          </h3>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {t.pillars.map((pillar, index) => {
              const Icon = iconMap[pillar.icon]
              return (
                <div
                  key={index}
                  className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 md:mb-6 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                    {pillar.title}
                  </h4>
                  <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Transformation Box */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg mb-8 md:mb-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t.transformationTitle}
          </h3>
          <p className="text-base md:text-lg text-white/95 leading-relaxed max-w-3xl mx-auto">
            {t.transformationText}
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href={`/${locale}/auth/register`}>
            <Button size="lg" rightIcon={ArrowRight} variant="primary">
              {t.cta}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
