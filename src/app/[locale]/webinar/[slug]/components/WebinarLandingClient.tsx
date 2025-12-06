'use client'

import { CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui'
import { DynamicRegistrationForm } from './DynamicRegistrationForm'
import {
  ImageRightTemplate,
  ImageLeftTemplate,
  ImageBackgroundTemplate,
  CenteredHeroTemplate,
  CenteredMinimalTemplate,
  GradientOverlayTemplate,
  VideoFocusTemplate,
  CardFloatTemplate,
  SplitDiagonalTemplate,
  type LandingPageConfig,
  type WebinarData,
} from '../templates'

interface WebinarLandingClientProps {
  webinar: {
    id: string
    title: string
    description: string | null
    presenterName: string | null
    presenterTitle: string | null
    presenterBio: string | null
    presenterAvatar: string | null
    thumbnailUrl: string | null
    scheduleConfig: {
      eventType: string
      startsAt: Date | null
      endsAt: Date | null
    } | null
  }
  landingPageConfig: LandingPageConfig | null
  slug: string
  locale: string
}

export function WebinarLandingClient({
  webinar,
  landingPageConfig,
  slug,
  locale,
}: WebinarLandingClientProps) {
  // If landing page config exists, use the customized template
  if (landingPageConfig) {
    const webinarData: WebinarData = {
      id: webinar.id,
      title: webinar.title,
      description: webinar.description,
      presenterName: webinar.presenterName,
      presenterTitle: webinar.presenterTitle,
      presenterBio: webinar.presenterBio,
      presenterAvatar: webinar.presenterAvatar,
      thumbnailUrl: webinar.thumbnailUrl,
      scheduleConfig: webinar.scheduleConfig,
    }

    // Render the appropriate template based on config
    switch (landingPageConfig.template) {
      case 'IMAGE_LEFT':
        return (
          <ImageLeftTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'IMAGE_BACKGROUND':
        return (
          <ImageBackgroundTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'CENTERED_HERO':
        return (
          <CenteredHeroTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'CENTERED_MINIMAL':
        return (
          <CenteredMinimalTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'GRADIENT_OVERLAY':
        return (
          <GradientOverlayTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'VIDEO_FOCUS':
        return (
          <VideoFocusTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'CARD_FLOAT':
        return (
          <CardFloatTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'SPLIT_DIAGONAL':
        return (
          <SplitDiagonalTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
      case 'IMAGE_RIGHT':
      default:
        return (
          <ImageRightTemplate
            config={landingPageConfig}
            webinar={webinarData}
            slug={slug}
            locale={locale}
          />
        )
    }
  }

  // Fallback: Original default layout when no landing page config exists
  const isGeorgian = locale === 'ka'

  return (
    <div className="min-h-screen bg-neu-base">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {webinar.title}
            </h1>
            {webinar.description && (
              <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
                {webinar.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Webinar Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thumbnail */}
            {webinar.thumbnailUrl && (
              <Card variant="raised" padding="none">
                <img
                  src={webinar.thumbnailUrl}
                  alt={webinar.title}
                  className="w-full h-auto rounded-neu-lg"
                />
              </Card>
            )}

            {/* Presenter Info */}
            <Card variant="raised" padding="lg">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {isGeorgian ? 'წამყვანის შესახებ' : 'About the Presenter'}
              </h2>
              <div className="flex items-start gap-6">
                {webinar.presenterAvatar && (
                  <img
                    src={webinar.presenterAvatar}
                    alt={webinar.presenterName ?? ''}
                    className="w-24 h-24 rounded-full object-cover shadow-neu"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {webinar.presenterName}
                  </h3>
                  {webinar.presenterTitle && (
                    <p className="text-text-secondary mt-1">{webinar.presenterTitle}</p>
                  )}
                  {webinar.presenterBio && (
                    <p className="text-text-secondary mt-4 leading-relaxed">
                      {webinar.presenterBio}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Registration Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card variant="raised" padding="lg">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-text-primary">
                    {isGeorgian ? 'რეგისტრაცია' : 'Register Now'}
                  </h2>
                  <p className="text-text-secondary mt-2">
                    {isGeorgian
                      ? 'შეავსეთ ფორმა ვებინარზე წვდომისთვის'
                      : 'Fill out the form to access the webinar'}
                  </p>
                </div>

                <DynamicRegistrationForm slug={slug} locale={locale} />

                <p className="text-xs text-text-muted text-center mt-4">
                  {isGeorgian
                    ? 'რეგისტრაციით თქვენ ეთანხმებით ჩვენს პირობებს'
                    : 'By registering, you agree to our terms and conditions'}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
