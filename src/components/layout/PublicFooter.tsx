'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export function PublicFooter() {
  const locale = useLocale()
  const t = useTranslations('footer')
  const nav = useTranslations('nav')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-neu-dark/30 border-t border-neu-dark/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary-600">
              {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
            </span>
            <span className="text-text-muted">
              © {currentYear}
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href={`/${locale}/about`}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {nav('about')}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t('privacy')}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t('terms')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {nav('contact')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
