import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { HeroVideoPlayer } from './HeroVideoPlayer'

const HERO_POSTER = 'https://cdn.nebiswera.com/hero/video-poster.jpg'

interface HeroSectionProps {
  locale: string
}

/**
 * Hero Section - Server Component for instant LCP
 *
 * Uses critical CSS classes inlined in root layout.
 * NO Tailwind dependency - renders immediately without waiting for CSS.
 */
export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations('home')

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <p className="hero-eyebrow">
            <span className="text-primary-600">{t('eyebrowStart')}</span>
            <span className="text-secondary"> {t('eyebrowEmphasis')} </span>
            <span className="text-primary-600">{t('eyebrowEnd')}</span>
          </p>

          <h1 className="hero-title">
            <span className="text-dark">{t('titlePart1')}</span>
            <span className="text-primary-600"> — </span>
            <span className="text-primary-600">{t('titlePart2')}</span>
          </h1>

          <h2 className="hero-subtitle">
            {t('subtitle')}
          </h2>

          {/* Video Container with LCP poster image */}
          <div className="hero-video-container">
            <img
              src={HERO_POSTER}
              alt=""
              className="hero-poster"
              fetchPriority="high"
              decoding="async"
            />
            <HeroVideoPlayer locale={locale} />
          </div>

          {/* CTA Buttons */}
          <div className="hero-buttons">
            <Link href={`/${locale}/auth/register`}>
              <button className="btn btn-primary">
                {t('getStarted')}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </Link>
            <a href="#learn-more">
              <button className="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
