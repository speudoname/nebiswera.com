import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@prisma/client'
import { formatDate } from '@/lib/time-utils'

interface Props {
  post: BlogPost
  locale: string
  featured?: boolean
}

export function BlogPostCard({ post, locale, featured }: Props) {
  const isKa = locale === 'ka'
  const title = isKa ? post.titleKa : post.titleEn
  const excerpt = isKa ? post.excerptKa : post.excerptEn
  const slug = isKa ? post.slugKa : post.slugEn

  if (featured) {
    return (
      <Link
        href={`/blog/${slug}`}
        className="group block bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
      >
        <div className="grid md:grid-cols-2">
          {/* Image */}
          {post.featuredImage && (
            <div className="relative aspect-[4/3] md:aspect-auto">
              <Image
                src={post.featuredImage}
                alt={post.featuredImageAlt || title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            {/* Category */}
            {post.category && (
              <span className="inline-block w-fit px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full mb-4">
                {post.category}
              </span>
            )}

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
              {title}
            </h2>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-text-secondary mb-4 line-clamp-3">{excerpt}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
              {post.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.publishedAt, locale)}
                </div>
              )}
              {post.readingTimeMinutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readingTimeMinutes} {isKa ? 'წთ' : 'min'}
                </div>
              )}
            </div>

            {/* Read More */}
            <div className="flex items-center gap-2 text-primary-600 font-medium group-hover:gap-3 transition-all">
              {isKa ? 'წაიკითხე მეტი' : 'Read more'}
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col md:flex-row gap-6 bg-white rounded-xl p-4 shadow hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      {post.featuredImage && (
        <div className="relative w-full md:w-48 aspect-video md:aspect-square flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Category */}
        {post.category && (
          <span className="inline-block w-fit px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-2">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-text-secondary text-sm mb-3 line-clamp-2">{excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.publishedAt)}
            </div>
          )}
          {post.readingTimeMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTimeMinutes} {isKa ? 'წთ' : 'min'}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
