'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { UserProfileDropdown } from '@/components/UserProfileDropdown'

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
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="text-xl font-bold text-indigo-600">
              {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
            </Link>
          </div>
          <div className="flex items-center">
            <UserProfileDropdown user={user} signOutAction={signOutAction} />
          </div>
        </div>
      </div>
    </header>
  )
}
