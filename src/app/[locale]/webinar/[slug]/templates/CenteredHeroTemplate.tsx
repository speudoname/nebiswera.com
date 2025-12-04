'use client'

import { LandingHeader, LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

/**
 * CENTERED_HERO Template
 * Beautiful centered layout with text above video/image
 * Inspired by the home hero section style
 */
export function CenteredHeroTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'
  const primaryColor = config.primaryColor || '#8B5CF6'
  const isVideo = config.heroMediaType === 'VIDEO' && config.heroVideoUrl

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Section 1: Hero - Centered Layout */}
      <section className="min-h-screen flex flex-col">
        <LandingHeader config={config} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-20">
          <div className="max-w-4xl w-full text-center space-y-6">
            {/* Eyebrow */}
            {config.heroEyebrow && (
              <p
                className="text-sm font-medium tracking-wider uppercase"
                style={{ color: primaryColor }}
              >
                {config.heroEyebrow}
              </p>
            )}

            {/* Title - Rich Text or Plain */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-text-primary">
              <RichTextRenderer
                parts={config.heroTitleParts}
                fallback={config.heroTitle || webinar.title}
                primaryColor={primaryColor}
              />
            </h1>

            {/* Subtitle - Rich Text or Plain */}
            {(config.heroSubtitleParts || config.heroSubtitle) && (
              <h2 className="text-xl md:text-2xl font-medium text-text-secondary max-w-2xl mx-auto">
                <RichTextRenderer
                  parts={config.heroSubtitleParts}
                  fallback={config.heroSubtitle || ''}
                  primaryColor={primaryColor}
                />
              </h2>
            )}

            {/* Paragraph */}
            {config.heroParagraph && (
              <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
                {config.heroParagraph}
              </p>
            )}

            {/* CTA Button */}
            <div className="pt-4">
              <RegistrationButton
                buttonText={config.heroButtonText || (locale === 'ka' ? 'დარეგისტრირდი' : 'Register Now')}
                belowButtonText={config.heroBelowButtonText}
                buttonStyle={config.heroButtonStyle}
                slug={slug}
                locale={locale}
                primaryColor={primaryColor}
              />
            </div>

            {/* Hero Media - Video or Image */}
            {(isVideo || config.heroImageUrl) && (
              <div className="pt-8 w-full max-w-3xl mx-auto">
                {isVideo ? (
                  <div className="rounded-neu overflow-hidden shadow-neu-lg">
                    <video
                      src={config.heroVideoUrl!}
                      controls
                      className="w-full aspect-video object-cover"
                      poster={config.heroImageUrl || undefined}
                    />
                  </div>
                ) : config.heroImageUrl && (
                  <div className="rounded-neu overflow-hidden shadow-neu-lg">
                    <img
                      src={config.heroImageUrl}
                      alt={config.heroTitle || webinar.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Below the Fold */}
      {(section2Items.length > 0 || config.section2Title) && (
        <section className="px-6 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Items List */}
              <div className="space-y-8">
                {config.section2Title && (
                  <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
                    {config.section2Title}
                  </h2>
                )}

                <div className="space-y-6">
                  {section2Items.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-xl font-semibold text-text-primary">
                        {item.headline}
                      </h3>
                      {item.subheadline && (
                        <p className="text-lg font-medium text-text-secondary">
                          {item.subheadline}
                        </p>
                      )}
                      {item.paragraph && (
                        <p className="text-text-secondary leading-relaxed">
                          {item.paragraph}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA + Presenter */}
              <div className="space-y-8">
                <div className="space-y-4">
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
                    <div className="pt-2">
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

                {/* Presenter */}
                {config.presenterImageUrl && (
                  <div className="flex items-start gap-4">
                    <img
                      src={config.presenterImageUrl}
                      alt={webinar.presenterName || 'Presenter'}
                      className={`w-24 h-24 object-cover shadow-neu ${
                        config.presenterImageShape === 'CIRCLE' ? 'rounded-full' : 'rounded-neu'
                      }`}
                    />
                    {webinar.presenterName && (
                      <div>
                        <p className="font-semibold text-text-primary">{webinar.presenterName}</p>
                        {webinar.presenterTitle && (
                          <p className="text-sm text-text-secondary">{webinar.presenterTitle}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <LandingFooter config={config} />
    </div>
  )
}
