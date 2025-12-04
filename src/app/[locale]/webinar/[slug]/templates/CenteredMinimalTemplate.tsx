'use client'

import { LandingHeader, LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

/**
 * CENTERED_MINIMAL Template
 * Clean, minimalist design with no hero media
 * Focus on typography and whitespace
 */
export function CenteredMinimalTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'
  const primaryColor = config.primaryColor || '#8B5CF6'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Section 1: Minimal Hero */}
      <section className="min-h-screen flex flex-col">
        <LandingHeader config={config} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24">
          <div className="max-w-3xl w-full text-center space-y-8">
            {/* Eyebrow */}
            {config.heroEyebrow && (
              <p
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: primaryColor }}
              >
                {config.heroEyebrow}
              </p>
            )}

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-text-primary">
              <RichTextRenderer
                parts={config.heroTitleParts}
                fallback={config.heroTitle || webinar.title}
                primaryColor={primaryColor}
              />
            </h1>

            {/* Decorative Line */}
            <div className="flex justify-center">
              <div
                className="w-24 h-1 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            </div>

            {/* Subtitle */}
            {(config.heroSubtitleParts || config.heroSubtitle) && (
              <h2 className="text-xl md:text-2xl text-text-secondary max-w-xl mx-auto leading-relaxed">
                <RichTextRenderer
                  parts={config.heroSubtitleParts}
                  fallback={config.heroSubtitle || ''}
                  primaryColor={primaryColor}
                />
              </h2>
            )}

            {/* Paragraph */}
            {config.heroParagraph && (
              <p className="text-lg text-text-muted leading-relaxed max-w-lg mx-auto">
                {config.heroParagraph}
              </p>
            )}

            {/* CTA Button */}
            <div className="pt-6">
              <RegistrationButton
                buttonText={config.heroButtonText || (locale === 'ka' ? 'დარეგისტრირდი' : 'Register Now')}
                belowButtonText={config.heroBelowButtonText}
                buttonStyle={config.heroButtonStyle}
                slug={slug}
                locale={locale}
                primaryColor={primaryColor}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Content */}
      {(section2Items.length > 0 || config.section2Title) && (
        <section className="px-6 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {config.section2Title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-12">
                {config.section2Title}
              </h2>
            )}

            {/* Items in a clean list */}
            <div className="space-y-12">
              {section2Items.map((item, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-2xl font-semibold text-text-primary">
                    {item.headline}
                  </h3>
                  {item.subheadline && (
                    <p className="text-lg text-text-secondary">
                      {item.subheadline}
                    </p>
                  )}
                  {item.paragraph && (
                    <p className="text-text-muted max-w-2xl mx-auto">
                      {item.paragraph}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            {(config.section2CtaText || config.section2ButtonText) && (
              <div className="mt-16 space-y-4">
                {config.section2CtaText && (
                  <p className="text-2xl font-bold text-text-primary">
                    {config.section2CtaText}
                  </p>
                )}
                {config.section2SubCtaText && (
                  <p className="text-lg text-text-secondary">
                    {config.section2SubCtaText}
                  </p>
                )}
                {config.section2ButtonText && (
                  <div className="pt-4">
                    <RegistrationButton
                      buttonText={config.section2ButtonText}
                      buttonStyle={config.section2ButtonStyle}
                      slug={slug}
                      locale={locale}
                      primaryColor={primaryColor}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Presenter */}
            {config.presenterImageUrl && (
              <div className="mt-16 flex flex-col items-center gap-4">
                <img
                  src={config.presenterImageUrl}
                  alt={webinar.presenterName || 'Presenter'}
                  className={`w-32 h-32 object-cover shadow-neu ${
                    config.presenterImageShape === 'CIRCLE' ? 'rounded-full' : 'rounded-neu'
                  }`}
                />
                {webinar.presenterName && (
                  <div className="text-center">
                    <p className="font-semibold text-text-primary text-lg">{webinar.presenterName}</p>
                    {webinar.presenterTitle && (
                      <p className="text-text-secondary">{webinar.presenterTitle}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <LandingFooter config={config} />
    </div>
  )
}
