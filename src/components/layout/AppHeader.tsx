'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { UserProfileDropdown } from './UserProfileDropdown'

interface AppHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
  signOutAction?: () => Promise<void>
}

export function AppHeader({ user, signOutAction }: AppHeaderProps) {
  const locale = useLocale()

  return (
    <header className="bg-neu-base shadow-neu-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              className="text-lg md:text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
            </Link>
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <UserProfileDropdown user={user} signOutAction={signOutAction} />
          </div>
        </div>
      </div>
    </header>
  )
}
