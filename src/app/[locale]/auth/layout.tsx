import Link from 'next/link'
import { useLocale } from 'next-intl'
import { LanguageSwitcher } from '@/components/layout'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = useLocale()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-500 to-accent-700">
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href={`/${locale}`} className="text-white font-bold text-xl">
            {locale === 'ka' ? ':::...ნებისწერა...:::' : ':::...nebiswera...:::'}
          </Link>
          <LanguageSwitcher darkBg />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
