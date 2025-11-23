'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

interface FooterProps {
  variant?: 'light' | 'dark'
}

export function Footer({ variant = 'dark' }: FooterProps) {
  const locale = useLocale()
  const t = useTranslations('footer')
  const nav = useTranslations('nav')

  const isLight = variant === 'light'
  const currentYear = new Date().getFullYear()

  return (
    <footer className={isLight ? 'bg-white/10 text-white' : 'bg-gray-50 border-t border-gray-200'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isLight ? 'text-white' : 'text-indigo-600'}`}>
              Nebiswera
            </span>
            <span className={isLight ? 'text-white/70' : 'text-gray-500'}>
              © {currentYear}
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href={`/${locale}/about`}
              className={isLight
                ? 'text-white/80 hover:text-white text-sm transition-colors'
                : 'text-gray-600 hover:text-gray-900 text-sm transition-colors'
              }
            >
              {nav('about')}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className={isLight
                ? 'text-white/80 hover:text-white text-sm transition-colors'
                : 'text-gray-600 hover:text-gray-900 text-sm transition-colors'
              }
            >
              {t('privacy')}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className={isLight
                ? 'text-white/80 hover:text-white text-sm transition-colors'
                : 'text-gray-600 hover:text-gray-900 text-sm transition-colors'
              }
            >
              {t('terms')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className={isLight
                ? 'text-white/80 hover:text-white text-sm transition-colors'
                : 'text-gray-600 hover:text-gray-900 text-sm transition-colors'
              }
            >
              {nav('contact')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
