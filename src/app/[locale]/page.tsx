import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Header } from '@/components/layout'

export default function Home() {
  const t = useTranslations('home')

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600">
      <Header variant="light" showAuthLinks />

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white p-8 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            {t('subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors shadow-lg"
            >
              {t('getStarted')}
            </Link>
            <Link
              href="#learn-more"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              {t('learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
