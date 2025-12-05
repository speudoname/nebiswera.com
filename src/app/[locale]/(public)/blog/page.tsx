import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'
import { BlogHeroSection } from './BlogHeroSection'
import { BlogPostCard } from './BlogPostCard'

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

  // Only fetch posts that are published AND have the current locale enabled
  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      // Filter by locale-specific publish flag
      ...(isKa ? { publishedKa: true } : { publishedEn: true }),
    },
    orderBy: { publishedAt: 'desc' },
  })

  // Filter out posts that don't have content in the current locale
  const postsWithContent = posts.filter((post) => {
    const title = isKa ? post.titleKa : post.titleEn
    const slug = isKa ? post.slugKa : post.slugEn
    return title && slug // Must have title and slug for the locale
  })

  return (
    <div className="min-h-screen">
      <BlogHeroSection />

      {/* Blog posts */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
        <div className="max-w-5xl mx-auto">
          {postsWithContent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-text-secondary">
                {isKa ? 'სტატიები მალე დაემატება...' : 'Articles coming soon...'}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:gap-12">
              {postsWithContent.map((post, index) => (
                <BlogPostCard key={post.id} post={post} locale={locale} featured={index === 0} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
