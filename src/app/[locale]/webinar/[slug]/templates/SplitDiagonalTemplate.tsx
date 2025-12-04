'use client'

import { LandingFooter, RegistrationButton } from './shared'
import { RichTextRenderer } from './shared/RichTextRenderer'
import type { TemplateProps, Section2Item } from './types'

/**
 * SPLIT_DIAGONAL Template
 * Diagonal split between content and media
 * Dynamic, modern design with visual interest
 */
export function SplitDiagonalTemplate({ config, webinar, slug, locale }: TemplateProps) {
  const section2Items = (config.section2Items || []) as Section2Item[]
  const bgColor = config.backgroundColor || '#E8E0F0'
  const primaryColor = config.primaryColor || '#8B5CF6'
  const isVideo = config.heroMediaType === 'VIDEO' && config.heroVideoUrl

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Section 1: Diagonal Split Hero */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Diagonal Background - Image/Video Side */}
        <div
          className="absolute top-0 right-0 w-full lg:w-[60%] h-full"
          style={{
            clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)',
          }}
        >
          {config.heroImageUrl ? (
            <>
              <img
                src={config.heroImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Subtle overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${bgColor} 0%, transparent 30%)`,
                }}
              />
            </>
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}30 0%, ${primaryColor}60 100%)`,
              }}
            />
          )}
        </div>

        {/* Header */}
        <div className="relative z-20 py-4 px-6">
          <div className="max-w-7xl mx-auto">
            {config.logoType === 'IMAGE' && config.logoImageUrl ? (
              <img
                src={config.logoImageUrl}
                alt="Logo"
                className="h-10 w-auto"
              />
            ) : (
              <span className="text-xl font-medium text-text-primary">
                {config.logoText || ':::...ნებისწერა...:::'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 flex-1 flex items-center px-6 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-xl space-y-6">
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
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-text-primary">
                <RichTextRenderer
                  parts={config.heroTitleParts}
                  fallback={config.heroTitle || webinar.title}
                  primaryColor={primaryColor}
                />
              </h1>

              {/* Subtitle */}
              {(config.heroSubtitleParts || config.heroSubtitle) && (
                <h2 className="text-xl lg:text-2xl text-text-secondary">
                  <RichTextRenderer
                    parts={config.heroSubtitleParts}
                    fallback={config.heroSubtitle || ''}
                    primaryColor={primaryColor}
                  />
                </h2>
              )}

              {/* Paragraph */}
              {config.heroParagraph && (
                <p className="text-lg text-text-secondary leading-relaxed">
                  {config.heroParagraph}
                </p>
              )}

              {/* Presenter */}
              {config.presenterImageUrl && (
                <div className="flex items-center gap-4">
                  <img
                    src={config.presenterImageUrl}
                    alt={webinar.presenterName || 'Presenter'}
                    className={`w-16 h-16 object-cover shadow-neu ${
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

              {/* CTA */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <RegistrationButton
                  buttonText={config.heroButtonText || (locale === 'ka' ? 'დარეგისტრირდი' : 'Register Now')}
                  belowButtonText={config.heroBelowButtonText}
                  buttonStyle={config.heroButtonStyle}
                  slug={slug}
                  locale={locale}
                  primaryColor={primaryColor}
                />

                {/* Video play button if video exists */}
                {isVideo && (
                  <button
                    className="flex items-center gap-2 text-text-primary hover:opacity-80 transition-opacity"
                    onClick={() => window.open(config.heroVideoUrl!, '_blank')}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-neu"
                      style={{ backgroundColor: 'white' }}
                    >
                      <svg
                        className="w-5 h-5 ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: primaryColor }}
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="font-medium">Watch Preview</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative diagonal line */}
        <div
          className="absolute bottom-0 left-0 w-full h-32 hidden lg:block"
          style={{
            background: `linear-gradient(to top, ${bgColor}, transparent)`,
          }}
        />
      </section>

      {/* Section 2: Content Below */}
      {(section2Items.length > 0 || config.section2Title) && (
        <section className="px-6 py-16 lg:py-24 relative">
          {/* Diagonal accent */}
          <div
            className="absolute top-0 left-0 w-32 h-full hidden lg:block"
            style={{
              background: `linear-gradient(to right, ${primaryColor}10, transparent)`,
            }}
          />

          <div className="max-w-6xl mx-auto relative z-10">
            {config.section2Title && (
              <div className="flex items-center gap-4 mb-12">
                <div
                  className="w-12 h-1 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
                  {config.section2Title}
                </h2>
              </div>
            )}

            {/* Alternating layout items */}
            <div className="space-y-12">
              {section2Items.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col md:flex-row gap-6 items-start ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Number */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-neu"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-semibold text-text-primary">
                      {item.headline}
                    </h3>
                    {item.subheadline && (
                      <p className="text-lg font-medium text-text-secondary">
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

            {/* CTA */}
            {(config.section2CtaText || config.section2ButtonText) && (
              <div className="mt-16 bg-white/50 rounded-neu p-8 lg:p-12 shadow-neu">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="text-center lg:text-left">
                    {config.section2CtaText && (
                      <p className="text-2xl font-bold text-text-primary">
                        {config.section2CtaText}
                      </p>
                    )}
                    {config.section2SubCtaText && (
                      <p className="text-lg text-text-secondary mt-2">
                        {config.section2SubCtaText}
                      </p>
                    )}
                  </div>
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
            )}
          </div>
        </section>
      )}

      <LandingFooter config={config} />
    </div>
  )
}
