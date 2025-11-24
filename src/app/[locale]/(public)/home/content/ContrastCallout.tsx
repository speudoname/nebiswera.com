'use client'

import { useLocale } from 'next-intl'
import { AlertTriangle, ArrowDown } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  question: string
  answer: string
  dependencies: Array<{
    label: string
    items: string[]
  }>
}> = {
  ka: {
    question: 'რა არის კონტრასტი იდეისა რომ "რასაც შენ ირჩევ ის არ ხდება"?',
    answer: 'თუ ეს ასე არაა, მაშინ რაც ხდება დამოკიდებულია:',
    dependencies: [
      {
        label: 'ნაწილობრივ შენზე',
        items: ['მაგრამ არა მთლიანად'],
      },
      {
        label: 'უმეტესად გარემოზე',
        items: ['სიტუაციაზე', 'შემთხვევებზე', 'გარეგან ფაქტორებზე'],
      },
      {
        label: 'სხვებზე',
        items: ['მათ ხასიათზე', 'მათ ქცევებზე', 'მათ გადაწყვეტილებებზე'],
      },
      {
        label: 'შენს თავზე',
        items: ['შენს ხასიათზე', '"ტრავმებზე"', 'უძლურებაზე'],
      },
    ],
  },
  en: {
    question: 'What is the contrast to the idea that "what you choose doesn\'t happen"?',
    answer: 'If this is the case, then what happens depends on:',
    dependencies: [
      {
        label: 'Partly on you',
        items: ['But not entirely'],
      },
      {
        label: 'Mostly on circumstances',
        items: ['Situations', 'Coincidences', 'External factors'],
      },
      {
        label: 'On others',
        items: ['Their character', 'Their behavior', 'Their decisions'],
      },
      {
        label: 'On yourself',
        items: ['Your character', '"Traumas"', 'Weaknesses'],
      },
    ],
  },
}

export function ContrastCallout() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <div className="bg-neu-light border-l-4 border-primary-600 rounded-neu p-6 md:p-8 shadow-neu-inset">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 mt-1">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
        </div>
        <h4 className="text-lg md:text-xl font-bold text-text-primary">
          {t.question}
        </h4>
      </div>

      <div className="mb-4">
        <p className="text-base md:text-lg text-text-secondary font-medium mb-4">
          {t.answer}
        </p>
      </div>

      <div className="space-y-4">
        {t.dependencies.map((dep, index) => (
          <div key={index} className="relative">
            {index > 0 && (
              <div className="absolute left-4 -top-2 text-primary-600">
                <ArrowDown className="w-4 h-4" />
              </div>
            )}
            <div className="bg-neu-base rounded-neu p-4 shadow-neu">
              <p className="font-semibold text-primary-600 mb-2">{dep.label}</p>
              <ul className="space-y-1 ml-4">
                {dep.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-text-secondary">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
