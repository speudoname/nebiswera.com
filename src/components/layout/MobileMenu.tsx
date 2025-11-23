'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Menu, X, LayoutDashboard, LogIn, UserPlus, Info, Mail } from 'lucide-react'
import { Button } from '@/components/ui'
import { LanguageSwitcher } from './LanguageSwitcher'

interface MobileMenuProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const locale = useLocale()
  const nav = useTranslations('nav')
  const isLoggedIn = !!user

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-text-primary" />
        ) : (
          <Menu className="w-6 h-6 text-text-primary" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`
          fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-neu-base z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-neu-lg' : 'translate-x-full'}
        `}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-neu-dark/20">
          <span className="font-bold text-primary-600">
            {locale === 'ka' ? 'ნებისწერა' : 'nebiswera'}
          </span>
          <button
            onClick={closeMenu}
            className="p-2 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        {/* Menu Content */}
        <nav className="p-4 flex flex-col gap-2">
          {isLoggedIn ? (
            <>
              {/* Logged in user menu */}
              <div className="pb-3 mb-3 border-b border-neu-dark/20">
                <p className="text-sm text-text-muted mb-1">{nav('login')}</p>
                <p className="font-medium text-text-primary truncate">
                  {user?.name || user?.email}
                </p>
              </div>
              <Link
                href={`/${locale}/dashboard`}
                onClick={closeMenu}
                className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                <span className="text-text-primary">{nav('dashboard')}</span>
              </Link>
            </>
          ) : (
            <>
              {/* Guest menu */}
              <Link
                href={`/${locale}/auth/login`}
                onClick={closeMenu}
                className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
              >
                <LogIn className="w-5 h-5 text-primary-600" />
                <span className="text-text-primary">{nav('login')}</span>
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                onClick={closeMenu}
                className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
              >
                <UserPlus className="w-5 h-5 text-primary-600" />
                <span className="text-text-primary">{nav('register')}</span>
              </Link>
            </>
          )}

          {/* Divider */}
          <hr className="my-2 border-neu-dark/20" />

          {/* Common links */}
          <Link
            href={`/${locale}/about`}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
          >
            <Info className="w-5 h-5 text-text-secondary" />
            <span className="text-text-primary">{nav('about')}</span>
          </Link>
          <Link
            href={`/${locale}/contact`}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
          >
            <Mail className="w-5 h-5 text-text-secondary" />
            <span className="text-text-primary">{nav('contact')}</span>
          </Link>

          {/* Language Switcher */}
          <div className="mt-4 pt-4 border-t border-neu-dark/20">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2 px-3">
              {locale === 'ka' ? 'ენა' : 'Language'}
            </p>
            <div className="px-3">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}
