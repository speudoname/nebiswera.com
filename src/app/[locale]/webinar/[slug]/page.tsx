import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WebinarLandingClient } from './WebinarLandingClient'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'
import { getWebinarEventSchema } from '@/lib/metadata'
import type { LandingPageConfig, Section2Item, RichTextPart } from './templates'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

/**
 * Generate dynamic metadata for webinar landing pages.
 * Uses landing page config for SEO if available, falls back to webinar data.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      thumbnailUrl: true,
      presenterName: true,
      status: true,
      landingPageConfig: {
        select: {
          heroTitle: true,
          heroParagraph: true,
          heroImageUrl: true,
        },
      },
    },
  })

  // Return minimal metadata if webinar not found or not published
  if (!webinar || webinar.status !== 'PUBLISHED') {
    return {
      title: 'Webinar Not Found',
      robots: { index: false, follow: false },
    }
  }

  // Use landing page config for SEO if available, otherwise fall back to webinar data
  const config = webinar.landingPageConfig
  const title = config?.heroTitle || webinar.title
  const description =
    config?.heroParagraph ||
    webinar.description ||
    `Join ${webinar.presenterName} for this exclusive webinar.`
  const canonicalUrl = `${seoConfig.siteUrl}/${locale}/webinar/${slug}`

  // Use hero image, webinar thumbnail, or fall back to default OG image
  const ogImage =
    config?.heroImageUrl ||
    webinar.thumbnailUrl ||
    `${seoConfig.siteUrl}${seoConfig.ogImage.defaultImage}`

  // Build hreflang alternates
  const languages: Record<string, string> = {}
  for (const loc of seoConfig.locales) {
    languages[loc] = `${seoConfig.siteUrl}/${loc}/webinar/${slug}`
  }
  languages['x-default'] = `${seoConfig.siteUrl}/${seoConfig.defaultLocale}/webinar/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Nebiswera',
      locale: locale === 'ka' ? 'ka_GE' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: seoConfig.ogImage.width,
          height: seoConfig.ogImage.height,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: seoConfig.social.twitter,
      images: [ogImage],
    },
  }
}

export default async function WebinarLandingPage({ params }: PageProps) {
  const { locale, slug } = await params

  // Fetch webinar data with schedule config and landing page config
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      presenterName: true,
      presenterTitle: true,
      presenterBio: true,
      presenterAvatar: true,
      thumbnailUrl: true,
      status: true,
      scheduleConfig: {
        select: {
          eventType: true,
          startsAt: true,
          endsAt: true,
        },
      },
      landingPageConfig: true,
    },
  })

  // If webinar doesn't exist or is not published, show 404
  if (!webinar || webinar.status !== 'PUBLISHED') {
    notFound()
  }

  // Use landing page config title for schema if available
  const schemaTitle = webinar.landingPageConfig?.heroTitle || webinar.title
  const schemaDescription = webinar.landingPageConfig?.heroParagraph || webinar.description

  // Generate JSON-LD Event schema for rich snippets
  const eventSchema = getWebinarEventSchema({
    title: schemaTitle,
    description: schemaDescription,
    slug,
    locale,
    presenterName: webinar.presenterName,
    thumbnailUrl: webinar.landingPageConfig?.heroImageUrl || webinar.thumbnailUrl,
    startDate: webinar.scheduleConfig?.startsAt,
    endDate: webinar.scheduleConfig?.endsAt,
    eventType: webinar.scheduleConfig?.eventType as
      | 'RECURRING'
      | 'ONE_TIME'
      | 'SPECIFIC_DATES'
      | 'ON_DEMAND'
      | undefined,
  })

  // Transform landing page config for the client component
  const landingPageConfig: LandingPageConfig | null = webinar.landingPageConfig
    ? {
        id: webinar.landingPageConfig.id,
        template: webinar.landingPageConfig.template,
        logoType: webinar.landingPageConfig.logoType,
        logoText: webinar.landingPageConfig.logoText,
        logoImageUrl: webinar.landingPageConfig.logoImageUrl,
        heroEyebrow: webinar.landingPageConfig.heroEyebrow,
        heroTitle: webinar.landingPageConfig.heroTitle,
        heroTitleParts: (webinar.landingPageConfig.heroTitleParts || null) as RichTextPart[] | null,
        heroSubtitle: webinar.landingPageConfig.heroSubtitle,
        heroSubtitleParts: (webinar.landingPageConfig.heroSubtitleParts || null) as RichTextPart[] | null,
        heroParagraph: webinar.landingPageConfig.heroParagraph,
        heroButtonText: webinar.landingPageConfig.heroButtonText,
        heroBelowButtonText: webinar.landingPageConfig.heroBelowButtonText,
        heroButtonStyle: webinar.landingPageConfig.heroButtonStyle,
        heroMediaType: webinar.landingPageConfig.heroMediaType,
        heroImageUrl: webinar.landingPageConfig.heroImageUrl,
        heroVideoUrl: webinar.landingPageConfig.heroVideoUrl,
        heroImagePlacement: webinar.landingPageConfig.heroImagePlacement,
        heroAlignment: webinar.landingPageConfig.heroAlignment,
        section2Title: webinar.landingPageConfig.section2Title,
        section2Items: (webinar.landingPageConfig.section2Items || []) as unknown as Section2Item[],
        section2CtaText: webinar.landingPageConfig.section2CtaText,
        section2SubCtaText: webinar.landingPageConfig.section2SubCtaText,
        section2ButtonText: webinar.landingPageConfig.section2ButtonText,
        section2ButtonStyle: webinar.landingPageConfig.section2ButtonStyle,
        section2ImagePlacement: webinar.landingPageConfig.section2ImagePlacement,
        section2Alignment: webinar.landingPageConfig.section2Alignment,
        presenterImageUrl: webinar.landingPageConfig.presenterImageUrl,
        presenterImageShape: webinar.landingPageConfig.presenterImageShape,
        footerDisclaimerText: webinar.landingPageConfig.footerDisclaimerText,
        primaryColor: webinar.landingPageConfig.primaryColor,
        backgroundColor: webinar.landingPageConfig.backgroundColor,
      }
    : null

  return (
    <>
      {/* JSON-LD Structured Data for Event/Course rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <WebinarLandingClient
        webinar={{
          id: webinar.id,
          title: webinar.title,
          description: webinar.description,
          presenterName: webinar.presenterName,
          presenterTitle: webinar.presenterTitle,
          presenterBio: webinar.presenterBio,
          presenterAvatar: webinar.presenterAvatar,
          thumbnailUrl: webinar.thumbnailUrl,
          scheduleConfig: webinar.scheduleConfig
            ? {
                eventType: webinar.scheduleConfig.eventType,
                startsAt: webinar.scheduleConfig.startsAt,
                endsAt: webinar.scheduleConfig.endsAt,
              }
            : null,
        }}
        landingPageConfig={landingPageConfig}
        slug={slug}
        locale={locale}
      />
    </>
  )
}
