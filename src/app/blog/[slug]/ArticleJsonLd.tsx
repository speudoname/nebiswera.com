interface ArticleJsonLdProps {
  url: string
  title: string
  description?: string | null
  datePublished: string
  dateModified: string
  authorName?: string | null
  publisherName: string
  publisherLogo: string
  image?: string | null
  locale?: string
  // Enhanced fields for better SEO
  category?: string | null
  tags?: string[]
  wordCount?: number
}

export function ArticleJsonLd({
  url,
  title,
  description,
  datePublished,
  dateModified,
  authorName,
  publisherName,
  publisherLogo,
  image,
  locale = 'ka',
  category,
  tags,
  wordCount,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || undefined,
    image: image ? {
      '@type': 'ImageObject',
      url: image,
      width: 1200,
      height: 630,
    } : undefined,
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en-US',
    datePublished,
    dateModified,
    author: authorName
      ? {
          '@type': 'Person',
          name: authorName,
        }
      : {
          '@type': 'Organization',
          name: publisherName,
        },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    // Enhanced fields
    ...(category ? { articleSection: category } : {}),
    ...(tags && tags.length > 0 ? { keywords: tags.join(', ') } : {}),
    ...(wordCount ? { wordCount } : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
