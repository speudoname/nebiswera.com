import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'
import { BlogPostContent } from './BlogPostContent'
import { ArticleJsonLd } from './ArticleJsonLd'

interface Props {
  params: Promise<{ slug: string }>
}

// Helper to determine which language version the slug matches
async function findPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      OR: [{ slugKa: slug }, { slugEn: slug }],
      status: 'PUBLISHED',
    },
  })

  if (!post) return null

  // Determine which language this slug belongs to
  const isGeorgian = post.slugKa === slug
  const locale = isGeorgian ? 'ka' : 'en'

  // Check if content exists for this language
  const title = isGeorgian ? post.titleKa : post.titleEn
  const content = isGeorgian ? post.contentKa : post.contentEn

  if (!title || !content) return null

  return { post, locale, isGeorgian }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  const result = await findPostBySlug(slug)

  if (!result) {
    return {
      title: 'Post Not Found',
    }
  }

  const { post, isGeorgian } = result
  const title = isGeorgian ? post.seoTitleKa || post.titleKa : post.seoTitleEn || post.titleEn
  const description = isGeorgian
    ? post.seoDescriptionKa || post.excerptKa
    : post.seoDescriptionEn || post.excerptEn
  const ogImage = isGeorgian ? post.ogImageKa || post.featuredImage : post.ogImageEn || post.featuredImage
  const currentSlug = isGeorgian ? post.slugKa : post.slugEn
  const canonicalUrl = `${seoConfig.siteUrl}/blog/${currentSlug}`

  return {
    title,
    description: description || undefined,
    // Canonical URL - tells search engines this is THE official URL
    alternates: {
      canonical: canonicalUrl,
      // Link to the other language version if it exists (hreflang)
      languages: {
        ...(post.slugKa && post.titleKa ? { 'ka': `${seoConfig.siteUrl}/blog/${post.slugKa}` } : {}),
        ...(post.slugEn && post.titleEn ? { 'en': `${seoConfig.siteUrl}/blog/${post.slugEn}` } : {}),
      },
    },
    openGraph: {
      title,
      description: description || undefined,
      type: 'article',
      url: canonicalUrl,
      siteName: 'ნებისწერა',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      // Include image dimensions for better social media rendering
      images: ogImage ? [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }] : undefined,
      locale: isGeorgian ? 'ka_GE' : 'en_US',
      // Add article section (category) if available
      ...(post.category ? { section: post.category } : {}),
      // Add tags if available
      ...(post.tags && post.tags.length > 0 ? { tags: post.tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || undefined,
      images: ogImage ? [{
        url: ogImage,
        alt: title,
      }] : undefined,
      creator: '@nebiswera',
    },
    // Additional SEO meta tags
    keywords: post.tags?.join(', ') || undefined,
    authors: post.authorName ? [{ name: post.authorName }] : undefined,
    category: post.category || undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  const result = await findPostBySlug(slug)

  if (!result) {
    notFound()
  }

  const { post, locale, isGeorgian } = result

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  })

  const postSlug = isGeorgian ? post.slugKa : post.slugEn
  const content = isGeorgian ? post.contentKa : post.contentEn
  const ogImage = isGeorgian ? post.ogImageKa || post.featuredImage : post.ogImageEn || post.featuredImage

  // Calculate word count from content (strip HTML tags first)
  const plainText = content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''
  const wordCount = plainText.split(' ').filter(word => word.length > 0).length

  return (
    <>
      <ArticleJsonLd
        url={`${seoConfig.siteUrl}/blog/${postSlug}`}
        title={isGeorgian ? post.titleKa : post.titleEn}
        description={isGeorgian ? post.excerptKa : post.excerptEn}
        datePublished={post.publishedAt?.toISOString() || post.createdAt.toISOString()}
        dateModified={post.updatedAt.toISOString()}
        authorName={post.authorName}
        publisherName="ნებისწერა"
        publisherLogo={`${seoConfig.siteUrl}/logo.png`}
        image={ogImage}
        locale={locale}
        category={post.category}
        tags={post.tags}
        wordCount={wordCount}
      />
      <BlogPostContent post={post} locale={locale} />
    </>
  )
}
