import type { MetadataRoute } from 'next'
import { seoConfig } from '@/config/seo'

/**
 * Generates robots.txt for search engine crawlers.
 *
 * - Allows crawling of public pages
 * - Blocks auth pages, admin, API routes, and authenticated areas
 * - Points to sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  const disallowPaths: string[] = []

  // Block all noIndex pages for each locale
  for (const locale of seoConfig.locales) {
    for (const page of seoConfig.noIndexPages) {
      disallowPaths.push(`/${locale}${page.path}`)
    }
  }

  // Block additional paths (API, admin, etc.)
  for (const path of seoConfig.robotsDisallow) {
    disallowPaths.push(path)
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowPaths,
    },
    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,
  }
}
