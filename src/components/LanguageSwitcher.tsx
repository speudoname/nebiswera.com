'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { locales, type Locale } from '@/i18n/config'
import { setStoredLocale } from '@/lib/locale-storage'

const localeConfig: Record<Locale, { flag: string; code: string; nameKey: 'en' | 'ka' }> = {
  ka: { flag: '🇬🇪', code: 'KA', nameKey: 'ka' },
  en: { flag: '🇬🇧', code: 'EN', nameKey: 'en' },
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const t = useTranslations('languages')
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    setStoredLocale(newLocale)
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const otherLocale = locales.find((l) => l !== locale) as Locale
  const other = localeConfig[otherLocale]

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className="flex items-center gap-2 px-3 py-2 rounded-neu bg-neu-base text-text-secondary shadow-neu-sm hover:shadow-neu hover:text-text-primary active:shadow-neu-pressed transition-all text-sm font-medium"
      title={t('switchTo', { language: t(other.nameKey) })}
    >
      <Globe className="w-4 h-4" />
      <span>{other.flag}</span>
      <span>{other.code}</span>
    </button>
  )
}
