'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface HeaderProps {
  variant?: 'light' | 'dark'
  user?: {
    email?: string | null
    role?: string
  } | null
  showAuthLinks?: boolean
  signOutAction?: () => Promise<void>
}

export function Header({ variant = 'dark', user, showAuthLinks = false, signOutAction }: HeaderProps) {
  const locale = useLocale()
  const nav = useTranslations('nav')

  const isLight = variant === 'light'

  const handleSignOut = () => {
    if (signOutAction) {
      signOutAction()
    } else {
      signOut({ callbackUrl: '/' })
    }
  }

  return (
    <nav className={isLight ? '' : 'bg-white shadow'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between ${isLight ? 'p-4' : 'h-16'}`}>
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              className={`text-xl font-bold ${isLight ? 'text-white' : 'text-indigo-600'}`}
            >
              Nebiswera
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant={isLight ? 'light' : 'dark'} />

            {showAuthLinks && !user && (
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className={isLight ? 'text-white hover:text-white/80 transition-colors' : 'text-gray-600 hover:text-gray-900 text-sm'}
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
              </>
            )}

            {user && (
              <>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    {nav('admin')}
                  </Link>
                )}
                <Link
                  href={`/${locale}/profile`}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {nav('profile')}
                </Link>
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {nav('dashboard')}
                </Link>
                {user.email && (
                  <span className="text-gray-700 text-sm">{user.email}</span>
                )}
                {signOutAction ? (
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      {nav('logout')}
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    {nav('logout')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

// Alias for backwards compatibility - same component handles both cases
export const ServerHeader = Header
