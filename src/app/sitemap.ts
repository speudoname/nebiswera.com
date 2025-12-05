import type { MetadataRoute } from 'next'
import { seoConfig } from '@/config/seo'
import { prisma } from '@/lib/db'

/**
 * Generates sitemap.xml with all indexable pages.
 *
 * - Includes all public pages from seoConfig.indexedPages
 * - Includes all published blog posts dynamically
 * - Generates URLs for each locale (ka, en)
 * - Adds hreflang alternates for language versions
 * - Uses priority and changefreq from config
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static pages from config
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
        changeFrequency: page.changefreq as 'weekly' | 'monthly' | 'yearly' | 'daily',
        priority: page.priority,
        alternates: {
          languages,
        },
      })
    }
  }

  // Dynamic blog posts
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slugKa: true,
        slugEn: true,
        updatedAt: true,
        publishedAt: true,
      },
    })

    for (const post of posts) {
      // Georgian version (if has Georgian slug)
      if (post.slugKa) {
        const kaUrl = `${seoConfig.siteUrl}/blog/${post.slugKa}`
        const enUrl = post.slugEn ? `${seoConfig.siteUrl}/blog/${post.slugEn}` : undefined

        entries.push({
          url: kaUrl,
          lastModified: post.updatedAt || post.publishedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: enUrl ? {
            languages: {
              ka: kaUrl,
              en: enUrl,
            },
          } : undefined,
        })
      }

      // English version (if has English slug)
      if (post.slugEn) {
        const enUrl = `${seoConfig.siteUrl}/blog/${post.slugEn}`
        const kaUrl = post.slugKa ? `${seoConfig.siteUrl}/blog/${post.slugKa}` : undefined

        entries.push({
          url: enUrl,
          lastModified: post.updatedAt || post.publishedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: kaUrl ? {
            languages: {
              ka: kaUrl,
              en: enUrl,
            },
          } : undefined,
        })
      }
    }
  } catch {
    // If database query fails, continue without blog posts
    console.error('Failed to fetch blog posts for sitemap')
  }

  return entries
}
