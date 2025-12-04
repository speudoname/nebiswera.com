'use client'

import { LandingHeader, LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

/**
 * VIDEO_FOCUS Template
 * Large centered video as the main visual element
 * Text above, video prominent
 */
export function VideoFocusTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'
  const primaryColor = config.primaryColor || '#8B5CF6'
  const hasVideo = config.heroMediaType === 'VIDEO' && config.heroVideoUrl

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Section 1: Video Focus Hero */}
      <section className="min-h-screen flex flex-col">
        <LandingHeader config={config} />

        <div className="flex-1 flex flex-col items-center px-6 py-12 lg:py-16">
          <div className="max-w-5xl w-full space-y-8">
            {/* Compact Text Above Video */}
            <div className="text-center space-y-4">
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-text-primary">
                <RichTextRenderer
                  parts={config.heroTitleParts}
                  fallback={config.heroTitle || webinar.title}
                  primaryColor={primaryColor}
                />
              </h1>

              {/* Subtitle */}
              {(config.heroSubtitleParts || config.heroSubtitle) && (
                <h2 className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
                  <RichTextRenderer
                    parts={config.heroSubtitleParts}
                    fallback={config.heroSubtitle || ''}
                    primaryColor={primaryColor}
                  />
                </h2>
              )}
            </div>

            {/* Large Video Player */}
            <div className="w-full">
              {hasVideo ? (
                <div className="rounded-neu-lg overflow-hidden shadow-neu-lg">
                  <video
                    src={config.heroVideoUrl!}
                    controls
                    className="w-full aspect-video object-cover"
                    poster={config.heroImageUrl || undefined}
                  />
                </div>
              ) : config.heroImageUrl ? (
                <div className="rounded-neu-lg overflow-hidden shadow-neu-lg">
                  <img
                    src={config.heroImageUrl}
                    alt={config.heroTitle || webinar.title}
                    className="w-full aspect-video object-cover"
                  />
                </div>
              ) : (
                /* Placeholder when no media */
                <div
                  className="w-full aspect-video rounded-neu-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <div className="text-center space-y-2">
                    <div
                      className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-text-muted">Video Coming Soon</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Below Video */}
            <div className="text-center space-y-4">
              {config.heroParagraph && (
                <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
                  {config.heroParagraph}
                </p>
              )}
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

      {/* Section 2: Content Below */}
      {(section2Items.length > 0 || config.section2Title) && (
        <section className="px-6 py-16 lg:py-24">
          <div className="max-w-5xl mx-auto">
            {config.section2Title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary text-center mb-12">
                {config.section2Title}
              </h2>
            )}

            {/* Grid of items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section2Items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/50 rounded-neu p-6 shadow-neu-sm space-y-3"
                >
                  {/* Number badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </div>
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
              ))}
            </div>

            {/* CTA Section */}
            {(config.section2CtaText || config.section2ButtonText) && (
              <div className="mt-16 text-center space-y-4">
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
              <div className="mt-12 flex flex-col items-center gap-4">
                <img
                  src={config.presenterImageUrl}
                  alt={webinar.presenterName || 'Presenter'}
                  className={`w-28 h-28 object-cover shadow-neu ${
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
