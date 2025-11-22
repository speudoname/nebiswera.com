'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('languages')

  const switchLocale = (newLocale: Locale) => {
    // Replace the locale in the current pathname
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="appearance-none bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1.5 pr-8 text-sm cursor-pointer hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc} className="text-gray-900">
            {t(loc)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

// Variant for dark backgrounds (like the header in admin or dashboard)
export function LanguageSwitcherDark() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('languages')

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="appearance-none bg-gray-100 text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
