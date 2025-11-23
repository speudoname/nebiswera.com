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
}

/**
 * Generates complete metadata for a page including:
 * - Title and description from content/seo/{locale}.json
 * - Canonical URL
 * - hreflang alternate links for all locales
 * - OpenGraph metadata for social sharing
 * - Twitter card metadata
 * - Robots directives (noindex for private pages)
 *
 * Usage in any page.tsx:
 * ```
 * export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 *   const { locale } = await params
 *   return generatePageMetadata('about', locale)
 * }
 * ```
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
    },

    // Twitter card
    twitter: {
      card: 'summary_large_image',
      title: pageData.title,
      description: pageData.description,
    },

    // Robots directive
    ...(shouldNoIndex && {
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    }),
  }
}
