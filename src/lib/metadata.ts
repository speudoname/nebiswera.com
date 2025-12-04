import type { Metadata } from 'next'
import { seoConfig, type PageKey } from '@/config/seo'

// Import SEO content
import seoEn from '../../content/seo/en.json'
import seoKa from '../../content/seo/ka.json'

type SeoContent = typeof seoEn
const seoContent: Record<string, SeoContent> = {
  en: seoEn,
  ka: seoKa,
}

interface MetadataOptions {
  /** Custom OG image path (overrides default) */
  ogImage?: string
}

/**
 * Generates complete metadata for a page including:
 * - Title and description from content/seo/{locale}.json
 * - Canonical URL
 * - hreflang alternate links for all locales
 * - OpenGraph metadata with images for social sharing (indexed pages only)
 * - Twitter card metadata with images (indexed pages only)
 * - Robots directives (noindex for private pages)
 *
 * Usage in any page.tsx:
 * ```
 * export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 *   const { locale } = await params
 *   return generatePageMetadata('about', locale)
 * }
 * ```
 *
 * OG Images:
 * - Place default.png in /public/og/ folder (1200x630px)
 * - Or provide custom path via options.ogImage
 */
export function generatePageMetadata(
  pageKey: PageKey,
  locale: string,
  options: MetadataOptions = {}
): Metadata {
  const content = seoContent[locale] || seoContent[seoConfig.defaultLocale]
  const pageData = content.pages[pageKey as keyof typeof content.pages]

  if (!pageData) {
    console.warn(`SEO: No metadata found for page "${pageKey}" in locale "${locale}"`)
    return {
      title: content.site.name,
      description: content.site.tagline,
    }
  }

  // Find the path for this page
  const indexedPage = seoConfig.indexedPages.find(p => p.key === pageKey)
  const noIndexPage = seoConfig.noIndexPages.find(p => p.key === pageKey)
  const pagePath = indexedPage?.path ?? noIndexPage?.path ?? ''

  // Build URLs
  const canonicalUrl = `${seoConfig.siteUrl}/${locale}${pagePath}`

  // Build hreflang alternates
  const languages: Record<string, string> = {}
  for (const loc of seoConfig.locales) {
    languages[loc] = `${seoConfig.siteUrl}/${loc}${pagePath}`
  }
  languages['x-default'] = `${seoConfig.siteUrl}/${seoConfig.defaultLocale}${pagePath}`

  // Determine if this page should be noindexed
  const shouldNoIndex = !!noIndexPage

  // Build base metadata
  const metadata: Metadata = {
    title: pageData.title,
    description: pageData.description,

    // Canonical and hreflang
    alternates: {
      canonical: canonicalUrl,
      languages,
    },

    // Robots directive
    robots: shouldNoIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
  }

  // Add OpenGraph and Twitter only for indexed pages (noIndex pages don't need social sharing)
  if (!shouldNoIndex) {
    const ogImagePath = options.ogImage || seoConfig.ogImage.defaultImage
    const ogImageUrl = `${seoConfig.siteUrl}${ogImagePath}`

    metadata.openGraph = {
      title: pageData.title,
      description: pageData.description,
      url: canonicalUrl,
      siteName: content.site.name,
      locale: locale === 'ka' ? 'ka_GE' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: seoConfig.ogImage.width,
          height: seoConfig.ogImage.height,
          alt: pageData.title,
        },
      ],
    }

    metadata.twitter = {
      card: 'summary_large_image',
      title: pageData.title,
      description: pageData.description,
      site: seoConfig.social.twitter,
      images: [ogImageUrl],
    }
  }

  return metadata
}

// ============================================================================
// JSON-LD Structured Data
// ============================================================================

/**
 * Organization schema - use in root layout for site-wide brand info
 */
export function getOrganizationSchema(locale: string = 'en') {
  const content = seoContent[locale] || seoContent[seoConfig.defaultLocale]

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: content.site.name,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/android-chrome-512x512.png`,
    sameAs: [
      // Add your social media URLs here when available
      // 'https://twitter.com/nebiswera',
      // 'https://facebook.com/nebiswera',
    ],
  }
}

/**
 * WebSite schema - enables sitelinks in Google
 */
export function getWebSiteSchema(locale: string) {
  const content = seoContent[locale] || seoContent[seoConfig.defaultLocale]

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: content.site.name,
    url: `${seoConfig.siteUrl}/${locale}`,
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en-US',
  }
}

// ============================================================================
// Webinar Event Schema
// ============================================================================

interface WebinarEventSchemaProps {
  title: string
  description: string | null
  slug: string
  locale: string
  presenterName: string | null
  thumbnailUrl: string | null
  startDate?: Date | null
  endDate?: Date | null
  eventType?: 'RECURRING' | 'ONE_TIME' | 'SPECIFIC_DATES' | 'ON_DEMAND'
}

/**
 * Event schema for webinar pages - enables rich snippets in Google search results.
 *
 * For recurring/scheduled webinars: uses OnlineEvent type with dates
 * For on-demand webinars: uses Course type (more appropriate)
 *
 * Usage in webinar page:
 * ```tsx
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebinarEventSchema({...})) }}
 * />
 * ```
 */
export function getWebinarEventSchema({
  title,
  description,
  slug,
  locale,
  presenterName,
  thumbnailUrl,
  startDate,
  endDate,
  eventType = 'RECURRING',
}: WebinarEventSchemaProps) {
  const url = `${seoConfig.siteUrl}/${locale}/webinar/${slug}`
  const image = thumbnailUrl || `${seoConfig.siteUrl}${seoConfig.ogImage.defaultImage}`

  // For on-demand content, use Course schema instead of Event
  if (eventType === 'ON_DEMAND') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: title,
      description: description || title,
      url,
      image,
      provider: {
        '@type': 'Organization',
        name: 'Nebiswera',
        url: seoConfig.siteUrl,
      },
      ...(presenterName && {
        instructor: {
          '@type': 'Person',
          name: presenterName,
        },
      }),
      inLanguage: locale === 'ka' ? 'ka-GE' : 'en-US',
      isAccessibleForFree: false,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT1H', // Approximate 1 hour
      },
    }
  }

  // For scheduled/recurring events, use Event schema
  const eventSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: title,
    description: description || title,
    url,
    image,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Nebiswera',
      url: seoConfig.siteUrl,
    },
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en-US',
  }

  // Add presenter if available
  if (presenterName) {
    eventSchema.performer = {
      '@type': 'Person',
      name: presenterName,
    }
  }

  // Add dates if available
  if (startDate) {
    eventSchema.startDate = startDate.toISOString()
  }
  if (endDate) {
    eventSchema.endDate = endDate.toISOString()
  }

  return eventSchema
}
