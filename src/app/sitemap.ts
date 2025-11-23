import type { MetadataRoute } from 'next'
import { seoConfig } from '@/config/seo'

/**
 * Generates sitemap.xml with all indexable pages.
 *
 * - Includes all public pages from seoConfig.indexedPages
 * - Generates URLs for each locale (ka, en)
 * - Adds hreflang alternates for language versions
 * - Uses priority and changefreq from config
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const page of seoConfig.indexedPages) {
    for (const locale of seoConfig.locales) {
      const url = `${seoConfig.siteUrl}/${locale}${page.path}`

      // Build alternates for hreflang
      const languages: Record<string, string> = {}
      for (const loc of seoConfig.locales) {
        languages[loc] = `${seoConfig.siteUrl}/${loc}${page.path}`
      }

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changefreq as 'weekly' | 'monthly' | 'yearly',
        priority: page.priority,
        alternates: {
          languages,
        },
      })
    }
  }

  return entries
}
