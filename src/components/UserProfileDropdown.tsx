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
  variant?: 'light' | 'dark'
}

export function UserProfileDropdown({ user, signOutAction, variant = 'dark' }: UserProfileDropdownProps) {
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
  const isLight = variant === 'light'

  const avatarClasses = isLight
    ? 'flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white text-sm font-medium hover:bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors'
    : 'flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={avatarClasses}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
          {/* User info section */}
          {user.name && (
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            </div>
          )}

          {/* Navigation links */}
          <div className="py-1">
            <Link
              href={`/${locale}/dashboard`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {nav('dashboard')}
            </Link>
            <Link
              href={`/${locale}/profile`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              {nav('profile')}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Shield className="w-4 h-4" />
                {nav('admin')}
              </Link>
            )}
          </div>

          {/* Language switcher - toggle to other language */}
          <div className="border-t border-gray-100 py-1">
            {(() => {
              const otherLocale = locales.find((l) => l !== locale) as Locale
              const otherConfig = localeConfig[otherLocale]
              return (
                <button
                  onClick={() => switchLocale(otherLocale)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{otherConfig.flag} {langT(otherConfig.nameKey)}</span>
                </button>
              )
            })()}
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 py-1">
            {signOutAction ? (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {nav('logout')}
                </button>
              </form>
            ) : (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
