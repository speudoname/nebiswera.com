'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { LayoutDashboard } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { UserProfileDropdown } from '@/components/UserProfileDropdown'

interface PublicHeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function PublicHeader({ user }: PublicHeaderProps) {
  const locale = useLocale()
  const nav = useTranslations('nav')
  const isLoggedIn = !!user

  return (
    <header className="bg-neu-base shadow-neu-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-neu font-medium shadow-neu-sm hover:shadow-neu hover:bg-primary-600 active:shadow-neu-pressed transition-all text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {nav('dashboard')}
                </Link>
                <UserProfileDropdown user={user} />
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-text-secondary hover:text-text-primary transition-colors font-medium text-sm px-3 py-2"
                >
                  {nav('login')}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="bg-primary-500 text-white px-4 py-2 rounded-neu font-medium shadow-neu-sm hover:shadow-neu hover:bg-primary-600 active:shadow-neu-pressed transition-all text-sm"
                >
                  {nav('register')}
                </Link>
                <LanguageSwitcher />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
