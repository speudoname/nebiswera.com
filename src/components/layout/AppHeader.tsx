'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface AppHeaderProps {
  user: {
    email?: string | null
    role?: string
  }
  signOutAction?: () => Promise<void>
}

export function AppHeader({ user, signOutAction }: AppHeaderProps) {
  const locale = useLocale()
  const nav = useTranslations('nav')

  const handleSignOut = () => {
    if (signOutAction) {
      signOutAction()
    } else {
      signOut({ callbackUrl: '/' })
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-indigo-600">
              {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                {nav('admin')}
              </Link>
            )}
            <Link
              href={`/${locale}/dashboard`}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              {nav('dashboard')}
            </Link>
            <Link
              href={`/${locale}/profile`}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              {nav('profile')}
            </Link>
            {user.email && (
              <span className="text-gray-500 text-sm">{user.email}</span>
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
            <LanguageSwitcher variant="dark" />
          </div>
        </div>
      </div>
    </header>
  )
}
