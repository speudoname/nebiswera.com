import { getTranslations } from 'next-intl/server'
import { HeroEmailCapture } from './HeroEmailCapture'
import { BunnyImage } from '@/components/ui/BunnyImage'

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

          {/* CTA Text */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 'bold', color: '#2D1B4E' }}>{t('ctaBold')}</span>{' '}
              <span style={{ fontWeight: 'normal', color: '#2D1B4E' }}>{t('ctaRegular')}</span>{' '}
              <span style={{ fontWeight: 'bold', color: '#8B5CF6' }}>{t('ctaAccentBold')}</span>
            </p>

            {/* Star Rating */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {/* Stars Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    style={{ width: '1.25rem', height: '1.25rem', color: '#FBBF24', fill: '#FBBF24' }}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              {/* Rating Text */}
              <span style={{ fontSize: '0.875rem', color: '#2D1B4E', textAlign: 'center' }}>{t('rating')}</span>
            </div>
          </div>

          {/* Board Image */}
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '24rem', borderRadius: '1rem', overflow: 'hidden', boxShadow: '6px 6px 12px #B8B4BD, -6px -6px 12px #FFFFFF' }}>
              <BunnyImage
                src="https://nebiswera-cdn.b-cdn.net/images/board.jpg"
                alt="Nebiswera Board"
                width={600}
                height={400}
                className="w-full h-auto"
                priority={false}
                quality={75}
                sizes="(max-width: 768px) 100vw, 384px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
