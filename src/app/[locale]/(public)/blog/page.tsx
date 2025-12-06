import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'
import { BlogHeroSection } from './components/BlogHeroSection'
import { BlogPostList } from './components/BlogPostList'

const POSTS_PER_PAGE = 10

// SEO metadata for blog list page
const blogSeo = {
  ka: {
    title: 'ბლოგი — სტატიები და აზრები | ნებისწერა',
    description: 'წაიკითხეთ სტატიები პიროვნული განვითარების, შეგნებული არჩევანის და ცხოვრების ტრანსფორმაციის შესახებ. ნებისწერის ბლოგი.',
  },
  en: {
    title: 'Blog — Articles and Insights | Nebiswera',
    description: 'Read articles about personal development, conscious choice, and life transformation. The Nebiswera blog.',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isKa = locale === 'ka'
  const seo = isKa ? blogSeo.ka : blogSeo.en
  const canonicalUrl = `${seoConfig.siteUrl}/${locale}/blog`

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ka: `${seoConfig.siteUrl}/ka/blog`,
        en: `${seoConfig.siteUrl}/en/blog`,
      },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: isKa ? 'ნებისწერა' : 'Nebiswera',
      type: 'website',
      locale: isKa ? 'ka_GE' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  }
}

export default async function BlogPage() {
  const locale = await getLocale()
  const isKa = locale === 'ka'

  // Fetch first page of posts with pagination
  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      ...(isKa ? { publishedKa: true } : { publishedEn: true }),
    },
    orderBy: { publishedAt: 'desc' },
    take: POSTS_PER_PAGE + 1, // Fetch one extra to check for more
    select: {
      id: true,
      slugKa: true,
      slugEn: true,
      titleKa: true,
      titleEn: true,
      excerptKa: true,
      excerptEn: true,
      featuredImage: true,
      featuredImageAlt: true,
      category: true,
      tags: true,
      publishedAt: true,
      authorName: true,
      authorAvatar: true,
      readingTimeMinutes: true,
      viewCount: true,
    },
  })

  // Filter posts that have content in the current locale
  const postsWithContent = posts.filter((post) => {
    const title = isKa ? post.titleKa : post.titleEn
    const slug = isKa ? post.slugKa : post.slugEn
    return title && slug
  })

  // Check if there are more posts
  const hasMore = postsWithContent.length > POSTS_PER_PAGE
  const initialPosts = hasMore ? postsWithContent.slice(0, POSTS_PER_PAGE) : postsWithContent
  const initialCursor = hasMore ? initialPosts[initialPosts.length - 1]?.id : null

  return (
    <div className="min-h-screen">
      <BlogHeroSection />

      {/* Blog posts */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
        <div className="max-w-5xl mx-auto">
          <BlogPostList
            initialPosts={initialPosts}
            initialCursor={initialCursor}
            initialHasMore={hasMore}
            locale={locale}
          />
        </div>
      </section>
    </div>
  )
}
