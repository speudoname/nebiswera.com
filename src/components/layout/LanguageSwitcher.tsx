'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { setStoredLocale } from '@/lib/locale-storage'

const localeConfig: Record<Locale, { flag: string; code: string; nameKey: 'en' | 'ka' }> = {
  ka: { flag: '🇬🇪', code: 'ქა', nameKey: 'ka' },
  en: { flag: '🇬🇧', code: 'EN', nameKey: 'en' },
}

interface LanguageSwitcherProps {
  /** Use dark background shadow variants (for use on gradients/dark surfaces) */
  darkBg?: boolean
  /** Compact mode - show only flag, no globe or code */
  compact?: boolean
}

export function LanguageSwitcher({ darkBg = false, compact = false }: LanguageSwitcherProps) {
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

  // Shadow classes based on background type
  // Note: uses 'darkbg' not 'dark' to avoid conflict with neu.dark color token
  const shadowClasses = darkBg
    ? 'shadow-neu-darkbg-sm hover:shadow-neu-darkbg active:shadow-neu-darkbg-pressed'
    : 'shadow-neu-sm hover:shadow-neu hover:text-text-primary active:shadow-neu-pressed'

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className={`flex items-center gap-1.5 ${compact ? 'px-2 py-1.5 text-lg' : 'px-3 py-2 text-sm'} rounded-neu bg-neu-base text-text-secondary ${shadowClasses} transition-all font-medium`}
      title={t('switchTo', { language: t(other.nameKey) })}
    >
      <span>{other.flag}</span>
      {!compact && <span>{other.code}</span>}
    </button>
  )
}
