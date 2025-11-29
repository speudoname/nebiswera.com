'use client'

import '@maily-to/core/style.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { SessionProvider } from '@/providers/SessionProvider'
import { Inter, Noto_Sans_Georgian } from 'next/font/google'
import { Home, Users, Mail, Settings, Undo2, LogOut, Heart, Contact2, Send, Video, Image } from 'lucide-react'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  variable: '--font-georgian',
})

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Contacts', href: '/admin/contacts', icon: Contact2 },
  { name: 'Campaigns', href: '/admin/campaigns', icon: Send },
  { name: 'Image Library', href: '/admin/library', icon: Image },
  { name: 'Webinars', href: '/admin/webinars', icon: Video },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Testimonials', href: '/admin/testimonials', icon: Heart },
  { name: 'Email Logs', href: '/admin/email-logs', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-neu-base">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-accent-900">
        <div className="flex h-16 items-center justify-center border-b border-accent-800">
          <Link href="/admin" className="text-xl font-bold text-white">
            Admin Panel
          </Link>
        </div>
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-neu px-3 py-2 text-sm font-medium transition-colors mb-1 ${
                  isActive
                    ? 'bg-accent-800 text-white'
                    : 'text-accent-300 hover:bg-accent-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-accent-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-neu px-3 py-2 text-sm font-medium text-accent-300 hover:bg-accent-800 hover:text-white transition-colors mb-2"
          >
            <Undo2 className="h-5 w-5" />
            Back to Site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex w-full items-center gap-3 rounded-neu px-3 py-2 text-sm font-medium text-accent-300 hover:bg-accent-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSansGeorgian.variable} font-sans`}>
        <SessionProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </SessionProvider>
      </body>
    </html>
  )
}
