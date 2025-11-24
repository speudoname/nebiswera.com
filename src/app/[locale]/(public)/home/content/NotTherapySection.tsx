'use client'

import { useLocale } from 'next-intl'
import { Wrench, XCircle, CheckCircle } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  analogyTitle: string
  analogy: string
  keyPoints: Array<{
    type: 'not' | 'is'
    text: string
  }>
}> = {
  ka: {
    eyebrow: 'რა არ არის ნებისწერა',
    title: 'ნებისწერა არ არის თერაპია',
    analogyTitle: 'შეუძლია კაცს ხის მოჭრა ხერხის გარეშე?',
    analogy: 'თუ კაცს არ შეუძლია ხის მოჭრა, იმიტომ რომ არ აქვს ხერხი, ეს არ ნიშნავს რომ ავადაა და მკურნალობა სჭირდება. მას უბრალოდ ინსტრუმენტი სჭირდება.',
    keyPoints: [
      { type: 'not', text: 'არ ვკურნავთ ტრავმებს — არ გვჯერა რომ ტრავმები არსებობს' },
      { type: 'not', text: 'არ არის "გამოხატვისა" და "განკურნების" სესიები' },
      { type: 'not', text: 'არ გეპყრობით როგორც დაზიანებულს ან ავადმყოფს' },
      { type: 'is', text: 'თქვენ ჯანმრთელი ხართ — უბრალოდ ინსტრუმენტები გჭირდებათ' },
      { type: 'is', text: 'ვასწავლით როგორ გამოიყენოთ შინაგანი ძალა' },
    ],
  },
  en: {
    eyebrow: 'What Nebiswera is NOT',
    title: 'Nebiswera is NOT Therapy',
    analogyTitle: 'Can a man cut a tree without a saw?',
    analogy: 'If a man can\'t cut a tree because he doesn\'t have a saw, it doesn\'t mean he\'s ill and needs treatment. He simply needs a tool.',
    keyPoints: [
      { type: 'not', text: 'We don\'t treat traumas — we don\'t believe traumas exist' },
      { type: 'not', text: 'No "expression" or "healing" sessions' },
      { type: 'not', text: 'We don\'t treat you as damaged or ill' },
      { type: 'is', text: 'You are healthy — you just need tools' },
      { type: 'is', text: 'We teach you how to use your inner power' },
    ],
  },
}

export function NotTherapySection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
      <div className="max-w-4xl mx-auto">
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
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md mb-10 md:mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-200 flex items-center justify-center shadow-neu-sm">
              <Wrench className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-text-primary text-center mb-4">
            {t.analogyTitle}
          </h3>
          <p className="text-base md:text-lg text-text-primary text-center leading-relaxed">
            {t.analogy}
          </p>
        </div>

        {/* Key Points */}
        <div className="space-y-4">
          {t.keyPoints.map((point, index) => (
            <div
              key={index}
              className={`rounded-neu p-5 md:p-6 flex items-start gap-4 ${
                point.type === 'not'
                  ? 'bg-neu-light shadow-neu-inset'
                  : 'bg-neu-base shadow-neu'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {point.type === 'not' ? (
                  <XCircle className="w-6 h-6 text-primary-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-primary-600 fill-primary-100" />
                )}
              </div>
              <p className={`text-sm md:text-base ${
                point.type === 'is' ? 'font-semibold text-text-primary' : 'text-text-secondary'
              }`}>
                {point.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
