'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { setStoredLocale } from '@/lib/locale-storage'

const localeConfig: Record<Locale, { flag: string; code: string; nameKey: 'en' | 'ka' }> = {
  ka: { flag: '🇬🇪', code: 'KA', nameKey: 'ka' },
  en: { flag: '🇬🇧', code: 'EN', nameKey: 'en' },
}

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark'
}

export function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const t = useTranslations('languages')
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    // Save to localStorage for faster subsequent loads
    setStoredLocale(newLocale)

    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const otherLocale = locales.find((l) => l !== locale) as Locale
  const other = localeConfig[otherLocale]

  const baseClasses = 'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer'
  const variantClasses = variant === 'light'
    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className={`${baseClasses} ${variantClasses}`}
      title={t('switchTo', { language: t(other.nameKey) })}
    >
      <span className="text-base">{other.flag}</span>
      <span>{other.code}</span>
    </button>
  )
}
