'use client'

import { useLocale } from 'next-intl'
import { Mail, Phone, Clock } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  title: string
  subtitle: string
  emailLabel: string
  phoneLabel: string
  hoursLabel: string
  hoursValue: string
  ownerLabel: string
  ownerValue: string
  idLabel: string
  idValue: string
}> = {
  ka: {
    title: 'დაგვიკავშირდით',
    subtitle: 'გაქვთ კითხვები? სიამოვნებით დაგეხმარებით!',
    emailLabel: 'ელ-ფოსტა',
    phoneLabel: 'ტელეფონი',
    hoursLabel: 'სამუშაო საათები',
    hoursValue: 'ორშაბათი - პარასკევი, 12:00 - 20:00',
    ownerLabel: 'მომსახურების მიმწოდებელი',
    ownerValue: 'მცირე მეწარმე "ლევან ბახია"',
    idLabel: 'პირადი ნომერი',
    idValue: '01031000466'
  },
  en: {
    title: 'Contact Us',
    subtitle: 'Have questions? We\'d love to help!',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    hoursLabel: 'Business Hours',
    hoursValue: 'Monday - Friday, 12:00 - 20:00',
    ownerLabel: 'Service Provider',
    ownerValue: 'Individual Entrepreneur "Levan Bakhia"',
    idLabel: 'Personal ID',
    idValue: '01031000466'
  }
}

export function ContactContent() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          {t.title}
        </h1>
        <p className="text-text-secondary">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-start gap-4 p-4 rounded-neu bg-neu-light/50">
          <div className="p-3 rounded-full bg-primary-100">
            <Mail className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{t.emailLabel}</h3>
            <a
              href="mailto:hello@nebiswera.com"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              hello@nebiswera.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-neu bg-neu-light/50">
          <div className="p-3 rounded-full bg-primary-100">
            <Phone className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{t.phoneLabel}</h3>
            <a
              href="tel:+995997892229"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              +995 99 789 229
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-neu bg-neu-light/50 md:col-span-2">
          <div className="p-3 rounded-full bg-primary-100">
            <Clock className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{t.hoursLabel}</h3>
            <p className="text-text-secondary">{t.hoursValue}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-neu-dark/20 pt-6">
        <div className="text-sm text-text-muted space-y-1">
          <p><span className="font-medium">{t.ownerLabel}:</span> {t.ownerValue}</p>
          <p><span className="font-medium">{t.idLabel}:</span> {t.idValue}</p>
        </div>
      </div>
    </div>
  )
}
