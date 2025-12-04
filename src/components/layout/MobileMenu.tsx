'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  UserPlus,
  User,
  BookOpen,
  Video,
  ChevronDown,
  Gamepad2,
  GraduationCap,
  Presentation,
  Calendar
} from 'lucide-react'
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
  const [programsExpanded, setProgramsExpanded] = useState(false)
  const locale = useLocale()
  const nav = useTranslations('nav')
  const isLoggedIn = !!user

  const closeMenu = () => {
    setIsOpen(false)
    setProgramsExpanded(false)
  }

  const programSubmenu = [
    { key: 'boardGame', hash: 'board-game', icon: Gamepad2 },
    { key: 'onlineCourses', hash: 'online-courses', icon: GraduationCap },
    { key: 'singleLectures', hash: 'single-lectures', icon: Presentation },
    { key: 'fullSchedule', hash: 'schedule', icon: Calendar },
  ]

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
        <nav className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-80px)]">
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

          {/* Main Navigation Links */}
          <Link
            href={`/${locale}/author`}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
          >
            <User className="w-5 h-5 text-text-secondary" />
            <span className="text-text-primary">{nav('about')}</span>
          </Link>

          {/* Programs with Submenu */}
          <div>
            <button
              onClick={() => setProgramsExpanded(!programsExpanded)}
              className="flex items-center justify-between w-full p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-text-secondary" />
                <span className="text-text-primary">{nav('programs')}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${programsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {programsExpanded && (
              <div className="ml-4 pl-4 border-l-2 border-primary-200 mt-1 space-y-1">
                {programSubmenu.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.key}
                      href={`/${locale}/programs#${item.hash}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-2 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-primary-500" />
                      <span className="text-sm text-text-primary">{nav(item.key)}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <Link
            href={`/${locale}/blog`}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-text-secondary" />
            <span className="text-text-primary">{nav('blog')}</span>
          </Link>

          <Link
            href={`/${locale}/videos`}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 rounded-neu-sm hover:bg-neu-dark/20 transition-colors"
          >
            <Video className="w-5 h-5 text-text-secondary" />
            <span className="text-text-primary">{nav('videos')}</span>
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
