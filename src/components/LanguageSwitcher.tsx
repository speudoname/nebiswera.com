'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'

const localeConfig: Record<Locale, { flag: string; code: string }> = {
  ka: { flag: '🇬🇪', code: 'KA' },
  en: { flag: '🇬🇧', code: 'EN' },
}

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark'
}

export function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const otherLocale = locales.find((l) => l !== locale) as Locale
  const current = localeConfig[locale]
  const other = localeConfig[otherLocale]

  const baseClasses = 'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer'
  const variantClasses = variant === 'light'
    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className={`${baseClasses} ${variantClasses}`}
      title={`Switch to ${other.code}`}
    >
      <span className="text-base">{other.flag}</span>
      <span>{other.code}</span>
    </button>
  )
}
