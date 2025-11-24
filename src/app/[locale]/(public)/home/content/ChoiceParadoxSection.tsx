'use client'

import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  text: string
}> = {
  ka: {
    eyebrow: 'ფილოსოფია',
    title: 'არჩევანის პარადოქსი',
    text: 'ნებისწერა ამბობს რომ რასაც შენ ირჩევ ის ხდება, მაგრამ ეს ნიშნავს იმასაც რომ თუ შენ ირჩევ რომ რასაც შენ ირჩევ ის ხდებოდეს, მაშინ რასაც შენ ირჩევ ის ხდება მართლაც, ხოლო თუ აირჩევ რომ შენს არჩევანს ძალა არ ჰქონდეს, და სხვებზე იყოს და გარემოებაზე დამოკიდებული, მაშინ მართლაც სხვაზე დამოკიდებული ხარ და გარემოზე, მაგრამ არა იმიტომ რომ ასე უნდა იყოს, არამედ იმიტომ რომ შენ აირჩიე, და შესაბამისად ეს არჩევანიც ასეა.',
  },
  en: {
    eyebrow: 'Philosophy',
    title: 'The Choice Paradox',
    text: 'Nebiswera says that what you choose happens, but this also means that if you choose that "what I choose happens", then what you choose really happens, but if you choose that your choice has no power, and it depends on others and circumstances, then you really are dependent on others and circumstances, but not because it must be that way, but because you chose it, and accordingly this choice works the same way.',
  },
}

export function ChoiceParadoxSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-base to-neu-light">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-6">
            {t.title}
          </h2>
        </div>

        {/* Simple Text Paragraph */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md">
          <p className="text-base md:text-lg text-text-primary leading-relaxed">
            {t.text}
          </p>
        </div>
      </div>
    </section>
  )
}
