'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { UserProfileDropdown } from '@/components/UserProfileDropdown'

interface PublicHeaderProps {
  variant?: 'light' | 'dark'
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function PublicHeader({ variant = 'light', user }: PublicHeaderProps) {
  const locale = useLocale()
  const nav = useTranslations('nav')

  const isLight = variant === 'light'
  const isLoggedIn = !!user

  return (
    <header className={isLight ? '' : 'bg-white shadow'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isLight ? 'py-4' : 'h-16'}`}>
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              className={`text-xl font-bold ${isLight ? 'text-white' : 'text-indigo-600'}`}
            >
              {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  className={isLight
                    ? 'bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors'
                    : 'bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm'
                  }
                >
                  {nav('dashboard')}
                </Link>
                <UserProfileDropdown user={user} variant={isLight ? 'light' : 'dark'} />
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className={isLight
                    ? 'text-white hover:text-white/80 transition-colors'
                    : 'text-gray-600 hover:text-gray-900 text-sm'
                  }
                >
                  {nav('login')}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className={isLight
                    ? 'bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors'
                    : 'bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm'
                  }
                >
                  {nav('register')}
                </Link>
                <LanguageSwitcher variant={isLight ? 'light' : 'dark'} />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
