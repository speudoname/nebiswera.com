'use client'

import { useLocale } from 'next-intl'
import { GitBranch, ChevronRight, Infinity } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { ContrastCallout } from './ContrastCallout'

const content: Record<Locale, {
  eyebrow: string
  title: string
  coreStatement: string
  paradoxTitle: string
  branches: Array<{
    condition: string
    result: string
    explanation: string
  }>
  keyInsight: string
}> = {
  ka: {
    eyebrow: 'ფილოსოფია',
    title: 'არჩევანის პარადოქსი',
    coreStatement: 'რასაც შენ ირჩევ, ის ხდება',
    paradoxTitle: 'მაგრამ ეს ნიშნავს:',
    branches: [
      {
        condition: 'თუ ირჩევ: "რასაც ვირჩევ, ის ხდება"',
        result: 'მაშინ რასაც ირჩევ, მართლაც ხდება',
        explanation: 'შენი არჩევანი ძალაუფლებას იძენს',
      },
      {
        condition: 'თუ ირჩევ: "ჩემი არჩევანი ძალა არ აქვს"',
        result: 'მაშინ ხდები დამოკიდებული სხვებზე და გარემოზე',
        explanation: 'მაგრამ არა იმიტომ რომ ასე უნდა იყოს, არამედ იმიტომ რომ შენ ასე აირჩიე',
      },
    ],
    keyInsight: 'თუ ცხოვრება სხვებსა და გარემოზეა დამოკიდებული, ეს თავად შენი არჩევანია. და ეს არჩევანიც ასეა.',
  },
  en: {
    eyebrow: 'Philosophy',
    title: 'The Choice Paradox',
    coreStatement: 'What you choose, happens',
    paradoxTitle: 'But this means:',
    branches: [
      {
        condition: 'If you choose: "What I choose happens"',
        result: 'Then what you choose really happens',
        explanation: 'Your choice gains power',
      },
      {
        condition: 'If you choose: "My choice has no power"',
        result: 'Then you become dependent on others and circumstances',
        explanation: 'But not because it must be that way, but because YOU chose it',
      },
    ],
    keyInsight: 'If life depends on others and circumstances, this itself is your choice. And this choice works the same way.',
  },
}

export function ChoiceParadoxSection() {
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-6">
            {t.title}
          </h2>
          <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-neu-lg shadow-neu-darkbg">
            <p className="text-xl md:text-2xl font-bold">
              {t.coreStatement}
            </p>
          </div>
        </div>

        {/* Paradox Intro */}
        <div className="text-center mb-10 md:mb-12">
          <h3 className="text-xl md:text-2xl font-semibold text-primary-600 mb-2">
            {t.paradoxTitle}
          </h3>
        </div>

        {/* Branches */}
        <div className="space-y-6 md:space-y-8 mb-12 md:mb-16">
          {t.branches.map((branch, index) => (
            <div key={index} className="bg-neu-base rounded-neu-lg p-6 md:p-8 shadow-neu">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                  <GitBranch className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base md:text-lg text-text-primary font-semibold mb-3">
                    {branch.condition}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <p className="text-base md:text-lg text-primary-600 font-bold">
                      {branch.result}
                    </p>
                  </div>
                  <div className="bg-neu-light rounded-neu p-4 shadow-neu-inset">
                    <p className="text-sm md:text-base text-text-secondary italic">
                      {branch.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md text-center">
          <div className="flex justify-center mb-4">
            <Infinity className="w-12 h-12 md:w-14 md:h-14 text-primary-600" />
          </div>
          <p className="text-base md:text-xl text-text-primary font-semibold leading-relaxed max-w-3xl mx-auto">
            {t.keyInsight}
          </p>
        </div>

        {/* Contrast Callout */}
        <div className="mt-12 md:mt-16">
          <ContrastCallout />
        </div>
      </div>
    </section>
  )
}
