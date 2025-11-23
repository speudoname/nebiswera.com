'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { User, LayoutDashboard, UserCircle, Shield, LogOut, Globe } from 'lucide-react'
import { locales, type Locale } from '@/i18n/config'
import { setStoredLocale } from '@/lib/locale-storage'

const localeConfig: Record<Locale, { flag: string; nameKey: 'en' | 'ka' }> = {
  ka: { flag: '🇬🇪', nameKey: 'ka' },
  en: { flag: '🇬🇧', nameKey: 'en' },
}

interface UserProfileDropdownProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
  signOutAction?: () => Promise<void>
}

export function UserProfileDropdown({ user, signOutAction }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const locale = useLocale() as Locale
  const nav = useTranslations('nav')
  const langT = useTranslations('languages')
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    setStoredLocale(newLocale)
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSignOut = () => {
    setIsOpen(false)
    if (signOutAction) {
      signOutAction()
    } else {
      signOut({ callbackUrl: '/' })
    }
  }

  const isAdmin = user.role === 'ADMIN'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-neu bg-neu-base text-primary-600 shadow-neu-sm hover:shadow-neu active:shadow-neu-pressed transition-all"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-10 h-10 rounded-neu object-cover"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-52 bg-neu-base rounded-neu-md shadow-neu-md py-2 z-50">
          {/* User info section */}
          {user.name && (
            <div className="px-4 py-2 border-b border-neu-dark/30 mb-1">
              <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
            </div>
          )}

          {/* Navigation links */}
          <div className="py-1">
            <Link
              href={`/${locale}/dashboard`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-neu-dark/30 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {nav('dashboard')}
            </Link>
            <Link
              href={`/${locale}/profile`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-neu-dark/30 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              {nav('profile')}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-neu-dark/30 transition-colors"
              >
                <Shield className="w-4 h-4" />
                {nav('admin')}
              </Link>
            )}
          </div>

          {/* Language switcher - toggle to other language */}
          <div className="border-t border-neu-dark/30 py-1 mt-1">
            {(() => {
              const otherLocale = locales.find((l) => l !== locale) as Locale
              const otherConfig = localeConfig[otherLocale]
              return (
                <button
                  onClick={() => switchLocale(otherLocale)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-neu-dark/30 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{otherConfig.flag} {langT(otherConfig.nameKey)}</span>
                </button>
              )
            })()}
          </div>

          {/* Sign out */}
          <div className="border-t border-neu-dark/30 py-1 mt-1">
            {signOutAction ? (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {nav('logout')}
                </button>
              </form>
            ) : (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {nav('logout')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
