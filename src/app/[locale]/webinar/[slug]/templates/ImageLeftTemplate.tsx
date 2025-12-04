'use client'

import { LandingHeader, LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

export function ImageLeftTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      <LandingHeader config={config} />

      {/* Section 1: Above the Fold - Image Left */}
      <section className="flex-1 px-6 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Image */}
            <div className="order-1">
              {config.heroImageUrl && (
                <div className="rounded-neu-lg overflow-hidden shadow-neu-lg">
                  <img
                    src={config.heroImageUrl}
                    alt={config.heroTitle || webinar.title}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* Right: Content */}
            <div className="order-2 space-y-6">
              {config.heroEyebrow && (
                <span
                  className="inline-block text-sm font-medium tracking-wider uppercase"
                  style={{ color: config.primaryColor || '#8B5CF6' }}
                >
                  {config.heroEyebrow}
                </span>
              )}

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary leading-tight">
                <RichTextRenderer
                  parts={config.heroTitleParts}
                  fallback={config.heroTitle || webinar.title}
                  primaryColor={config.primaryColor}
                />
              </h1>

              {(config.heroSubtitleParts || config.heroSubtitle) && (
                <h2 className="text-xl lg:text-2xl text-text-secondary font-medium">
                  <RichTextRenderer
                    parts={config.heroSubtitleParts}
                    fallback={config.heroSubtitle || ''}
                    primaryColor={config.primaryColor}
                  />
                </h2>
              )}

              {config.heroParagraph && (
                <p className="text-lg text-text-secondary leading-relaxed">
                  {config.heroParagraph}
                </p>
              )}

              <div className="pt-4">
                <RegistrationButton
                  buttonText={config.heroButtonText || (locale === 'ka' ? 'დარეგისტრირდი' : 'Register Now')}
                  belowButtonText={config.heroBelowButtonText}
                  buttonStyle={config.heroButtonStyle}
                  slug={slug}
                  locale={locale}
                  primaryColor={config.primaryColor}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Below the Fold */}
      {(section2Items.length > 0 || config.section2Title) && (
        <section className="px-6 py-16 lg:py-24 bg-neu-light/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left: CTA + Presenter */}
              <div className="space-y-8">
                {/* CTA Text */}
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
                        primaryColor={config.primaryColor}
                      />
                    </div>
                  )}
                </div>

                {/* Presenter Image */}
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

              {/* Right: Items List */}
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
            </div>
          </div>
        </section>
      )}

      <LandingFooter config={config} />
    </div>
  )
}
