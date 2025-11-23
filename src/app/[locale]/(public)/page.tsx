import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function Home() {
  const t = useTranslations('home')

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-white p-8 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 [text-shadow:_2px_2px_8px_rgba(74,48,96,0.4)]">
          {t('title')}
        </h1>
        <p className="text-xl md:text-2xl opacity-90 mb-8">
          {t('subtitle')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="gap-2">
              {t('getStarted')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="#learn-more">
            <Button variant="ghost" size="lg" className="text-white border-2 border-white hover:bg-white/10 gap-2">
              <BookOpen className="w-5 h-5" />
              {t('learnMore')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
