'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { LayoutDashboard, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserProfileDropdown } from './UserProfileDropdown'
import { MobileMenu } from './MobileMenu'

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
  const [programsOpen, setProgramsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProgramsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const programSubmenu = [
    { key: 'boardGame', hash: 'board-game' },
    { key: 'onlineCourses', hash: 'online-courses' },
    { key: 'singleLectures', hash: 'single-lectures' },
    { key: 'fullSchedule', hash: 'schedule' },
  ]

  return (
    <header className="bg-neu-base shadow-neu-sm sticky top-0 z-40">
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

          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {/* Main Nav Links */}
            <nav className="flex items-center gap-1 mr-4">
              <Link
                href={`/${locale}/author`}
                className="px-3 py-2 text-base font-bold text-text-primary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {nav('about')}
              </Link>

              {/* Programs Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProgramsOpen(!programsOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-base font-bold text-text-primary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  {nav('programs')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${programsOpen ? 'rotate-180' : ''}`} />
                </button>

                {programsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-neu-base rounded-lg shadow-neu-md border border-neu-dark/10 py-2 z-50">
                    {programSubmenu.map((item) => (
                      <Link
                        key={item.key}
                        href={`/${locale}/programs#${item.hash}`}
                        onClick={() => setProgramsOpen(false)}
                        className="block px-4 py-2 text-sm text-text-primary hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        {nav(item.key)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href={`/${locale}/blog`}
                className="px-3 py-2 text-base font-bold text-text-primary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {nav('blog')}
              </Link>

              <Link
                href={`/${locale}/videos`}
                className="px-3 py-2 text-base font-bold text-text-primary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {nav('videos')}
              </Link>
            </nav>

            {/* Auth Section */}
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

          {/* Mobile Navigation - shown only on mobile */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher compact />
            <MobileMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  )
}
