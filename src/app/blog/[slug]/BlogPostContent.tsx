'use client'

import { useEffect } from 'react'
import { Calendar, Clock, ArrowLeft, Share2, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@prisma/client'
import { formatDate } from '@/lib/time-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { usePixel } from '@/hooks/usePixel'
import { useViewContentTracker } from '@/hooks/useViewContentTracker'

interface Props {
  post: BlogPost
  locale: string
}

export function BlogPostContent({ post, locale }: Props) {
  const isKa = locale === 'ka'
  const title = isKa ? post.titleKa : post.titleEn

  // Facebook Pixel tracking
  const { trackPageView } = usePixel({ pageType: 'blog' })

  // ViewContent tracking based on scroll and read time
  useViewContentTracker({
    pageType: 'blog',
    readingTimeMinutes: post.readingTimeMinutes || undefined,
    contentParams: {
      content_name: title,
      content_category: post.category || 'Blog',
      content_ids: [post.id],
      content_type: 'article',
      blog_post_id: post.id,
      blog_post_title: title,
    },
  })

  // Track PageView on mount
  useEffect(() => {
    trackPageView({
      content_name: title,
      content_category: post.category || 'Blog',
      content_type: 'article',
    })
  }, [trackPageView, title, post.category])

  const content = isKa ? post.contentKa : post.contentEn
  const excerpt = isKa ? post.excerptKa : post.excerptEn

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt || '',
          url: window.location.href,
        })
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert(isKa ? 'ლინკი დაკოპირდა!' : 'Link copied!')
    }
  }

  return (
    <article className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative w-full h-[50vh] md:h-[60vh]">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt || title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        {/* Title Overlay or Simple Header */}
        <div
          className={`${
            post.featuredImage
              ? 'absolute bottom-0 left-0 right-0 text-white pb-12'
              : 'bg-neu-base pt-24 pb-12'
          }`}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Back Button */}
            <Link
              href={`/${locale}/blog`}
              className={`inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
                post.featuredImage
                  ? 'text-white/80 hover:text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {isKa ? 'ბლოგი' : 'Blog'}
            </Link>

            {/* Category */}
            {post.category && (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-4 ${
                  post.featuredImage
                    ? 'bg-white/20 text-white'
                    : 'bg-primary-100 text-primary-700'
                }`}
              >
                {post.category}
              </span>
            )}

            {/* Title */}
            <h1
              className={`text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 ${
                post.featuredImage ? 'text-white' : 'text-text-primary'
              }`}
            >
              {title}
            </h1>

            {/* Meta Info */}
            <div
              className={`flex flex-wrap items-center gap-4 text-sm ${
                post.featuredImage ? 'text-white/80' : 'text-text-secondary'
              }`}
            >
              {/* Author */}
              {post.authorName && (
                <div className="flex items-center gap-2">
                  {post.authorAvatar ? (
                    <Image
                      src={post.authorAvatar}
                      alt={post.authorName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        post.featuredImage ? 'bg-white/20' : 'bg-primary-100'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-medium">{post.authorName}</span>
                </div>
              )}

              {/* Date */}
              {post.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.publishedAt, locale)}
                </div>
              )}

              {/* Reading Time */}
              {post.readingTimeMinutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readingTimeMinutes} {isKa ? 'წთ' : 'min read'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Actions */}
      <div className="sticky top-24 z-10 hidden lg:block">
        <div className="absolute left-8 flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow text-text-secondary hover:text-primary-600"
            title={isKa ? 'გაზიარება' : 'Share'}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Excerpt/Lead */}
        {excerpt && (
          <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-8 font-serif italic">
            {excerpt}
          </p>
        )}

        {/* Article Content */}
        <div
          className="prose prose-lg md:prose-xl max-w-none
            prose-headings:text-text-primary prose-headings:font-bold
            prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-text-secondary prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-text-primary prose-strong:font-semibold
            prose-blockquote:border-l-4 prose-blockquote:border-primary-500
            prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-text-secondary
            prose-img:rounded-lg prose-img:shadow-lg
            prose-ul:list-disc prose-ol:list-decimal
            prose-li:text-text-secondary prose-li:mb-2
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:text-gray-100"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-gray-100 text-text-secondary rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Actions */}
        <div className="lg:hidden mt-8">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-lg text-text-secondary hover:bg-gray-200 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            {isKa ? 'გაზიარება' : 'Share'}
          </button>
        </div>

        {/* Author Bio */}
        {post.authorName && (
          <div className="mt-12 p-6 bg-neu-base rounded-2xl">
            <div className="flex items-start gap-4">
              {post.authorAvatar ? (
                <Image
                  src={post.authorAvatar}
                  alt={post.authorName}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
              )}
              <div>
                <p className="text-sm text-text-secondary uppercase tracking-wide mb-1">
                  {isKa ? 'ავტორი' : 'Written by'}
                </p>
                <h3 className="text-xl font-bold text-text-primary">{post.authorName}</h3>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Blog */}
      <div className="bg-neu-base py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isKa ? 'ყველა სტატია' : 'All Articles'}
          </Link>
        </div>
      </div>
    </article>
  )
}
