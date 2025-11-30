import { getTranslations } from 'next-intl/server'
import { HeroVideoPlayer } from './HeroVideoPlayer'
import { HeroEmailCapture } from './HeroEmailCapture'

const HERO_POSTER = 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/thumbnail_8f42b11e.jpg'

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
            <span className="text-primary">{t('eyebrowStart')}</span>
            <span className="text-secondary"> {t('eyebrowEmphasis')} </span>
            <span className="text-primary">{t('eyebrowEnd')}</span>
          </p>

          <h1 className="hero-title">
            <span className="text-dark">{t('titlePart1')}</span>
            <span className="text-primary"> — </span>
            <span className="text-primary">{t('titlePart2')}</span>
          </h1>

          <h2 className="hero-subtitle">
            {t('subtitle')}
          </h2>

          {/* Email Capture Form */}
          <HeroEmailCapture />

          {/* Video Container with LCP poster image */}
          <div className="hero-video-container">
            <img
              src={HERO_POSTER}
              alt=""
              width={1920}
              height={1080}
              className="hero-poster"
              fetchPriority="high"
              decoding="async"
            />
            <HeroVideoPlayer locale={locale} />
          </div>
        </div>
      </div>
    </section>
  )
}
