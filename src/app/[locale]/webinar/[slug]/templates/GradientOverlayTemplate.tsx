'use client'

import { LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

/**
 * GRADIENT_OVERLAY Template
 * Image background with beautiful gradient overlay
 * Modern, eye-catching design
 */
export function GradientOverlayTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'
  const primaryColor = config.primaryColor || '#8B5CF6'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Section 1: Hero with Gradient Overlay */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background Image */}
        {config.heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={config.heroImageUrl}
              alt={config.heroTitle || webinar.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}E6 0%, ${primaryColor}99 40%, transparent 70%)`,
          }}
        />

        {/* Header */}
        <div className="relative z-20 py-4 px-6">
          <div className="max-w-7xl mx-auto">
            {config.logoType === 'IMAGE' && config.logoImageUrl ? (
              <img
                src={config.logoImageUrl}
                alt="Logo"
                className="h-10 w-auto brightness-0 invert"
              />
            ) : (
              <span className="text-xl font-medium text-white">
                {config.logoText || ':::...ნებისწერა...:::'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 flex-1 flex items-center px-6 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-2xl space-y-6 text-white">
              {/* Eyebrow */}
              {config.heroEyebrow && (
                <p className="text-sm font-medium tracking-wider uppercase text-white/90">
                  {config.heroEyebrow}
                </p>
              )}

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
                <RichTextRenderer
                  parts={config.heroTitleParts}
                  fallback={config.heroTitle || webinar.title}
                  primaryColor="#FFFFFF"
                />
              </h1>

              {/* Subtitle */}
              {(config.heroSubtitleParts || config.heroSubtitle) && (
                <h2 className="text-xl lg:text-2xl font-medium text-white/90">
                  <RichTextRenderer
                    parts={config.heroSubtitleParts}
                    fallback={config.heroSubtitle || ''}
                    primaryColor="#FFFFFF"
                  />
                </h2>
              )}

              {/* Paragraph */}
              {config.heroParagraph && (
                <p className="text-lg text-white/80 leading-relaxed">
                  {config.heroParagraph}
                </p>
              )}

              {/* CTA */}
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
            </div>
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
