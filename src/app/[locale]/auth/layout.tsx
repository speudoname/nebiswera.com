import Link from 'next/link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-xl">
          Nebiswera
        </Link>
        <LanguageSwitcher />
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
