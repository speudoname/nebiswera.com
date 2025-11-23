'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserProfileDropdown } from './UserProfileDropdown'

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
                <Link href={`/${locale}/dashboard`}>
                  <Button size="sm" leftIcon={LayoutDashboard}>
                    {nav('dashboard')}
                  </Button>
                </Link>
                <UserProfileDropdown user={user} />
              </>
            ) : (
              <>
                <Link href={`/${locale}/auth/login`}>
                  <Button variant="ghost" size="sm">
                    {nav('login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/auth/register`}>
                  <Button size="sm">
                    {nav('register')}
                  </Button>
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
