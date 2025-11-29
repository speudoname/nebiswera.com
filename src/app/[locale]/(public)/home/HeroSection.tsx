import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { HeroVideoPlayer } from './HeroVideoPlayer'

const HERO_POSTER = 'https://cdn.nebiswera.com/hero/video-poster.jpg'

interface HeroSectionProps {
  locale: string
}

/**
 * Hero Section - Server Component for fast LCP
 *
 * Uses next/image with priority for automatic LCP optimization:
 * - Adds preload link
 * - Disables lazy loading
 * - Sets fetchPriority="high"
 */
export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations('home')

  return (
    <section className="pt-4 pb-16 md:pt-8 md:pb-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-3xl">
          <p className="eyebrow mb-4 md:mb-4">
            <span className="text-primary-600">{t('eyebrowStart')}</span>
            <span className="text-text-secondary"> {t('eyebrowEmphasis')} </span>
            <span className="text-primary-600">{t('eyebrowEnd')}</span>
          </p>
          <h1 className="hero-title mb-4 md:mb-6">
            <span className="text-text-primary">{t('titlePart1')}</span>
            <span className="text-primary-600"> — </span>
            <span className="text-primary-600">{t('titlePart2')}</span>
          </h1>
          <h2 className="hero-subtitle mb-6 md:mb-8">
            {t('subtitle')}
          </h2>

          {/* Video Container with inline styles for instant paint - NO CSS dependency */}
          <div
            className="hero-video-container mb-6 md:mb-8 shadow-neu"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '36rem',
              margin: '0 auto',
              aspectRatio: '16/9',
              borderRadius: '1rem',
              overflow: 'hidden',
            }}
          >
            {/* LCP Image - inline styles for ZERO render delay */}
            <img
              src={HERO_POSTER}
              alt=""
              className="hero-poster"
              fetchPriority="high"
              decoding="async"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Video Player - Client component, loads on top */}
            <HeroVideoPlayer locale={locale} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href={`/${locale}/auth/register`} className="w-full sm:w-auto">
              <button className="inline-flex items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neu-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none bg-primary-500 text-white shadow-neu hover:shadow-neu-hover hover:bg-primary-600 active:shadow-neu-pressed active:bg-primary-700 px-8 py-3.5 text-base gap-2.5 w-full sm:w-auto">
                {t('getStarted')}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </Link>
            <a href="#learn-more" className="w-full sm:w-auto">
              <button className="inline-flex items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neu-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none bg-neu-base text-primary-600 border-2 border-primary-300 shadow-neu-sm hover:shadow-neu hover:border-primary-400 hover:bg-primary-50 active:shadow-neu-inset-sm px-8 py-3.5 text-base gap-2.5 w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 7v14"></path>
                  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
                {t('learnMore')}
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
