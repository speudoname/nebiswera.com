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
  /** Set to true for pages that should not be indexed (auth, dashboard, etc.) */
  noIndex?: boolean
  /** Custom OG image path (overrides default pattern) */
  ogImage?: string
}

/**
 * Generates complete metadata for a page including:
 * - Title and description from content/seo/{locale}.json
 * - Canonical URL
 * - hreflang alternate links for all locales
 * - OpenGraph metadata with images for social sharing
 * - Twitter card metadata with images
 * - Robots directives (noindex for private pages, rich snippet settings for public)
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
 * - Place images in /public/og/ folder
 * - Name them by pageKey: home.png, about.png, etc.
 * - Or provide custom path via options.ogImage
 * - Falls back to /og/default.png if page-specific image doesn't exist
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
  const shouldNoIndex = options.noIndex || !!noIndexPage

  // Build OG image URL
  // Priority: custom option > page-specific > default
  const ogImagePath = options.ogImage || `/og/${pageKey}.png`
  const ogImageUrl = `${seoConfig.siteUrl}${ogImagePath}`

  return {
    title: pageData.title,
    description: pageData.description,

    // Canonical and hreflang
    alternates: {
      canonical: canonicalUrl,
      languages,
    },

    // OpenGraph for social sharing (Facebook, LinkedIn, etc.)
    openGraph: {
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
    },

    // Twitter card
    twitter: {
      card: 'summary_large_image',
      title: pageData.title,
      description: pageData.description,
      site: seoConfig.social.twitter,
      images: [ogImageUrl],
    },

    // Robots directive
    robots: shouldNoIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  }
}

// ============================================================================
// JSON-LD Structured Data
// ============================================================================

/**
 * Organization schema - use in root layout for site-wide brand info
 *
 * Usage in app/[locale]/layout.tsx:
 * ```
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
 * />
 * ```
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nebiswera',
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
 * WebSite schema with search action - enables sitelinks search box in Google
 *
 * Usage in app/[locale]/layout.tsx (alongside Organization schema):
 * ```
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebSiteSchema(locale)) }}
 * />
 * ```
 */
export function getWebSiteSchema(locale: string) {
  const content = seoContent[locale] || seoContent[seoConfig.defaultLocale]

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: content.site.name,
    url: `${seoConfig.siteUrl}/${locale}`,
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en-US',
    // Uncomment when you have search functionality:
    // potentialAction: {
    //   '@type': 'SearchAction',
    //   target: `${seoConfig.siteUrl}/${locale}/search?q={search_term_string}`,
    //   'query-input': 'required name=search_term_string',
    // },
  }
}

/**
 * WebPage schema - use on individual pages for page-specific structured data
 *
 * Usage in page.tsx or layout.tsx:
 * ```
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebPageSchema('home', 'en')) }}
 * />
 * ```
 */
export function getWebPageSchema(pageKey: PageKey, locale: string) {
  const content = seoContent[locale] || seoContent[seoConfig.defaultLocale]
  const pageData = content.pages[pageKey as keyof typeof content.pages]

  if (!pageData) return null

  const indexedPage = seoConfig.indexedPages.find(p => p.key === pageKey)
  const noIndexPage = seoConfig.noIndexPages.find(p => p.key === pageKey)
  const pagePath = indexedPage?.path ?? noIndexPage?.path ?? ''
  const canonicalUrl = `${seoConfig.siteUrl}/${locale}${pagePath}`

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageData.title,
    description: pageData.description,
    url: canonicalUrl,
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: content.site.name,
      url: `${seoConfig.siteUrl}/${locale}`,
    },
  }
}

/**
 * Breadcrumb schema - use for pages with navigation hierarchy
 *
 * Usage:
 * ```
 * const breadcrumbs = [
 *   { name: 'Home', url: '/en' },
 *   { name: 'About', url: '/en/about' },
 * ]
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbSchema(breadcrumbs)) }}
 * />
 * ```
 */
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${seoConfig.siteUrl}${item.url}`,
    })),
  }
}
