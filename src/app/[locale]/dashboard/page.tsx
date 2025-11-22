import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { LanguageSwitcherDark } from '@/components/LanguageSwitcher'

export default async function DashboardPage() {
  const locale = await getLocale()
  const t = await getTranslations('dashboard')
  const nav = await getTranslations('nav')
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get full user data including verification status
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      email: true,
      name: true,
      emailVerified: true,
      emailVerificationSentAt: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const welcomeMessage = user.name
    ? t('welcome', { name: user.name })
    : t('welcomeDefault')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={`/${locale}`} className="text-xl font-bold text-indigo-600">
                Nebiswera
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcherDark />
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {nav('admin')}
                </Link>
              )}
              <Link
                href={`/${locale}/profile`}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                {nav('profile')}
              </Link>
              <span className="text-gray-700 text-sm">{user.email}</span>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/' })
                }}
              >
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {nav('logout')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {!user.emailVerified && (
            <EmailVerificationBanner
              email={user.email}
              verificationSentAt={user.emailVerificationSentAt}
            />
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {welcomeMessage}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              {user.emailVerified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('emailVerified')}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {t('emailPending')}
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-indigo-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          My Courses
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Completed
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Purchases
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
