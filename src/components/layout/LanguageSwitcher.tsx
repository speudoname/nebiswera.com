'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { setStoredLocale } from '@/lib/locale-storage'

const localeConfig: Record<Locale, { flag: string; code: string; nameKey: 'en' | 'ka' }> = {
  ka: { flag: '🇬🇪', code: 'ქა', nameKey: 'ka' },
  en: { flag: '🇬🇧', code: 'EN', nameKey: 'en' },
}

interface LanguageSwitcherProps {
  /** Use dark background shadow variants (for use on gradients/dark surfaces) */
  darkBg?: boolean
  /** Compact mode - minimal styling for mobile header */
  compact?: boolean
}

export function LanguageSwitcher({ darkBg = false, compact = false }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const t = useTranslations('languages')
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    setStoredLocale(newLocale)
    const segments = (pathname || '/').split('/')
    segments[1] = newLocale
    // Use hard navigation to ensure middleware runs and server components re-render
    window.location.href = segments.join('/')
  }

  const otherLocale = locales.find((l) => l !== locale) as Locale
  const other = localeConfig[otherLocale]

  // Compact mode: simple text link style for mobile
  if (compact) {
    return (
      <button
        onClick={() => switchLocale(otherLocale)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
        title={t('switchTo', { language: t(other.nameKey) })}
      >
        <span>{other.flag}</span>
        <span>{other.code}</span>
      </button>
    )
  }

  // Full mode: neomorphic button style for desktop
  const shadowClasses = darkBg
    ? 'shadow-neu-darkbg-sm hover:shadow-neu-darkbg active:shadow-neu-darkbg-pressed'
    : 'shadow-neu-sm hover:shadow-neu hover:text-text-primary active:shadow-neu-pressed'

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-neu bg-neu-base text-text-secondary ${shadowClasses} transition-all font-medium`}
      title={t('switchTo', { language: t(other.nameKey) })}
    >
      <span>{other.flag}</span>
      <span>{other.code}</span>
    </button>
  )
}
