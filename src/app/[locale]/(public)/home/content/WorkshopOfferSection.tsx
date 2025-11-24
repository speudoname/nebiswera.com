'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Calendar, Clock, Brain, Target, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  scheduleTitle: string
  schedule: Array<{ day: string, time: string }>
  followUp: string
  transformationTitle: string
  transformationText: string
  pillarsTitle: string
  pillars: Array<{
    icon: 'brain' | 'target' | 'heart'
    title: string
    description: string
  }>
  stats: Array<{ number: string, label: string }>
  resultsTitle: string
  results: string[]
  cta: string
}> = {
  ka: {
    eyebrow: '3-დღიანი ვორქშოპი',
    title: '29 საათი, რომელიც შეცვლის შენს ცხოვრებას',
    subtitle: 'ინტენსიური პროგრამა, სადაც მთელი მაგია ხდება',
    scheduleTitle: 'განრიგი',
    schedule: [
      { day: 'პარასკევი', time: '19:00 - 23:30' },
      { day: 'შაბათი', time: '11:00 - 23:00' },
      { day: 'კვირა', time: '11:00 - 23:00' },
    ],
    followUp: 'ოთხშაბათს შემაჯამებელი შეხვედრა',
    transformationTitle: 'შედეგი',
    transformationText: 'პარასკევს შემოდიხართ ერთი სამყაროდან, ორშაბათს უკვე სხვაში ხართ. თქვენი ცნობიერება ირთვება, ყურადღება მაღლა არის, სავსე ხართ ინსაიტებით, თვითრწმენით და ძალით შეცვალოთ თქვენი ცხოვრება.',
    pillarsTitle: 'სამი მთავარი კომპონენტი',
    pillars: [
      {
        icon: 'brain',
        title: 'ნებისწერის თეორემა და კონცეფციები',
        description: '81 კონცეფტი, რომელიც სრულიად ცვლის შენი ცხოვრების ხედვას და გაგებას',
      },
      {
        icon: 'target',
        title: 'ყველა ფორმულა და ინსტრუმენტი',
        description: '18+ ვარჯიში და ტექნიკა, რომლებიც პრაქტიკულად გამოიყენებ',
      },
      {
        icon: 'heart',
        title: 'შინაგანი მუშაობა',
        description: 'მედიტაციები, ტრანსი, თვითშემეცნების პროცესები - გამოცდილებითი სწავლება',
      },
    ],
    stats: [
      { number: '29', label: 'საათი' },
      { number: '18+', label: 'ვარჯიში' },
      { number: '81', label: 'კონცეფტი' },
      { number: '45', label: 'აღმოჩენა' },
    ],
    resultsTitle: 'რას მიაღწევ',
    results: [
      'ცნობიერება გააქტიურდება',
      'ყურადღება გამკვეთრდება',
      'ინსაიტებით აივსები',
      'თვითრწმენა და ძალა შეგძენია',
      'ცხოვრების შეცვლის რეალური უნარი მოიპოვებ',
    ],
    cta: 'მომდევნო ვორქშოპზე გამოცხადება',
  },
  en: {
    eyebrow: '3-Day Workshop',
    title: '29 Hours That Will Change Your Life',
    subtitle: 'Intensive program where all the magic happens',
    scheduleTitle: 'Schedule',
    schedule: [
      { day: 'Friday', time: '19:00 - 23:30' },
      { day: 'Saturday', time: '11:00 - 23:00' },
      { day: 'Sunday', time: '11:00 - 23:00' },
    ],
    followUp: 'Follow-up meeting on Wednesday',
    transformationTitle: 'The Transformation',
    transformationText: 'You enter Friday from one world, by Monday you\'re in another. Your consciousness turns on, attention sharpens, you\'re full of insights, self-confidence, and power to change your life.',
    pillarsTitle: 'Three Core Components',
    pillars: [
      {
        icon: 'brain',
        title: 'Nebiswera Theorem & Concepts',
        description: '81 concepts that completely transform your vision and understanding of life',
      },
      {
        icon: 'target',
        title: 'All Formulas & Tools',
        description: '18+ exercises and techniques you\'ll use practically',
      },
      {
        icon: 'heart',
        title: 'Inner Work',
        description: 'Meditations, trance, self-exploration processes - experiential learning',
      },
    ],
    stats: [
      { number: '29', label: 'Hours' },
      { number: '18+', label: 'Exercises' },
      { number: '81', label: 'Concepts' },
      { number: '45', label: 'Discoveries' },
    ],
    resultsTitle: 'What You\'ll Achieve',
    results: [
      'Consciousness activated',
      'Attention sharpened',
      'Filled with insights',
      'Self-confidence and power acquired',
      'Real ability to change your life',
    ],
    cta: 'Apply for Next Workshop',
  },
}

const iconMap = {
  brain: Brain,
  target: Target,
  heart: Heart,
}

export function WorkshopOfferSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-primary-50 via-neu-base to-primary-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {t.title}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary">
            {t.subtitle}
          </p>
        </div>

        {/* Schedule Card */}
        <div className="bg-neu-base rounded-neu-lg p-6 md:p-8 shadow-neu mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-neu bg-primary-100 flex items-center justify-center shadow-neu-sm">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-text-primary">
              {t.scheduleTitle}
            </h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {t.schedule.map((day, index) => (
              <div key={index} className="bg-neu-light rounded-neu p-4 shadow-neu-inset text-center">
                <div className="font-semibold text-primary-600 mb-1">{day.day}</div>
                <div className="text-text-secondary text-sm flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{day.time}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-text-secondary italic">
            + {t.followUp}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {t.stats.map((stat, index) => (
            <div key={index} className="bg-neu-base rounded-neu p-6 shadow-neu text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                {stat.number}
              </div>
              <div className="text-sm md:text-base text-text-secondary">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

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

        {/* Results List */}
        <div className="bg-neu-base rounded-neu-lg p-6 md:p-8 shadow-neu mb-8">
          <h4 className="text-xl md:text-2xl font-bold text-text-primary mb-6 text-center">
            {t.resultsTitle}
          </h4>
          <ul className="space-y-3 max-w-2xl mx-auto">
            {t.results.map((result, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                  <span className="text-primary-600 text-sm font-bold">✓</span>
                </div>
                <span className="text-text-primary text-base md:text-lg">{result}</span>
              </li>
            ))}
          </ul>
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
