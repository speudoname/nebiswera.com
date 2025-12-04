'use client'

import { LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

/**
 * CARD_FLOAT Template
 * Text content in a floating card over a background image
 * Elegant, modern design with depth
 */
export function CardFloatTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'
  const primaryColor = config.primaryColor || '#8B5CF6'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Section 1: Floating Card Hero */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background Image */}
        {config.heroImageUrl ? (
          <div className="absolute inset-0 z-0">
            <img
              src={config.heroImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay for readability */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          /* Gradient background when no image */
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${bgColor} 50%, ${primaryColor}20 100%)`,
            }}
          />
        )}

        {/* Header with logo */}
        <div className="relative z-20 py-4 px-6">
          <div className="max-w-7xl mx-auto">
            {config.logoType === 'IMAGE' && config.logoImageUrl ? (
              <img
                src={config.logoImageUrl}
                alt="Logo"
                className="h-10 w-auto drop-shadow-lg"
              />
            ) : (
              <span className="text-xl font-medium text-white drop-shadow-lg">
                {config.logoText || ':::...ნებისწერა...:::'}
              </span>
            )}
          </div>
        </div>

        {/* Floating Card */}
        <div className="relative z-20 flex-1 flex items-center px-6 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto w-full">
            <div
              className="max-w-xl bg-white/95 backdrop-blur-sm rounded-neu-lg shadow-neu-lg p-8 lg:p-12 space-y-6"
            >
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
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight text-text-primary">
                <RichTextRenderer
                  parts={config.heroTitleParts}
                  fallback={config.heroTitle || webinar.title}
                  primaryColor={primaryColor}
                />
              </h1>

              {/* Subtitle */}
              {(config.heroSubtitleParts || config.heroSubtitle) && (
                <h2 className="text-lg lg:text-xl text-text-secondary">
                  <RichTextRenderer
                    parts={config.heroSubtitleParts}
                    fallback={config.heroSubtitle || ''}
                    primaryColor={primaryColor}
                  />
                </h2>
              )}

              {/* Paragraph */}
              {config.heroParagraph && (
                <p className="text-text-secondary leading-relaxed">
                  {config.heroParagraph}
                </p>
              )}

              {/* Presenter inline */}
              {config.presenterImageUrl && (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={config.presenterImageUrl}
                    alt={webinar.presenterName || 'Presenter'}
                    className={`w-12 h-12 object-cover shadow-neu-sm ${
                      config.presenterImageShape === 'CIRCLE' ? 'rounded-full' : 'rounded-neu'
                    }`}
                  />
                  {webinar.presenterName && (
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{webinar.presenterName}</p>
                      {webinar.presenterTitle && (
                        <p className="text-xs text-text-secondary">{webinar.presenterTitle}</p>
                      )}
                    </div>
                  )}
                </div>
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

        {/* Video modal hint if video exists */}
        {config.heroMediaType === 'VIDEO' && config.heroVideoUrl && (
          <div className="absolute bottom-8 right-8 z-20">
            <button
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-neu hover:shadow-neu-md transition-shadow"
              onClick={() => {
                // In a real implementation, this would open a video modal
                window.open(config.heroVideoUrl!, '_blank')
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-text-primary">Watch Video</span>
            </button>
          </div>
        )}
      </section>

      {/* Section 2: Content */}
      {(section2Items.length > 0 || config.section2Title) && (
        <section className="px-6 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            {config.section2Title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-12">
                {config.section2Title}
              </h2>
            )}

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Items */}
              <div className="space-y-8">
                {section2Items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    {/* Accent line */}
                    <div
                      className="w-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-text-primary">
                        {item.headline}
                      </h3>
                      {item.subheadline && (
                        <p className="text-base font-medium text-text-secondary">
                          {item.subheadline}
                        </p>
                      )}
                      {item.paragraph && (
                        <p className="text-text-muted leading-relaxed">
                          {item.paragraph}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Column */}
              <div className="lg:pl-8">
                <div
                  className="bg-white/70 rounded-neu p-8 shadow-neu space-y-6 sticky top-8"
                >
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
                    <RegistrationButton
                      buttonText={config.section2ButtonText}
                      buttonStyle={config.section2ButtonStyle}
                      slug={slug}
                      locale={locale}
                      primaryColor={primaryColor}
                    />
                  )}
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
