'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { BlogPostCard } from './BlogPostCard'
import type { BlogPost } from '@prisma/client'

type BlogPostPreview = Pick<
  BlogPost,
  | 'id'
  | 'slugKa'
  | 'slugEn'
  | 'titleKa'
  | 'titleEn'
  | 'excerptKa'
  | 'excerptEn'
  | 'featuredImage'
  | 'featuredImageAlt'
  | 'category'
  | 'tags'
  | 'publishedAt'
  | 'authorName'
  | 'authorAvatar'
  | 'readingTimeMinutes'
  | 'viewCount'
>

interface Props {
  initialPosts: BlogPostPreview[]
  initialCursor: string | null
  initialHasMore: boolean
  locale: string
}

export function BlogPostList({ initialPosts, initialCursor, initialHasMore, locale }: Props) {
  const [posts, setPosts] = useState<BlogPostPreview[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const isKa = locale === 'ka'

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return

    setLoading(true)
    try {
      const res = await fetch(`/api/blog?locale=${locale}&cursor=${cursor}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setPosts((prev) => [...prev, ...data.posts])
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore, loading, locale])

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-text-secondary">
          {isKa ? 'სტატიები მალე დაემატება...' : 'Articles coming soon...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Posts Grid */}
      <div className="grid gap-8 md:gap-12">
        {posts.map((post, index) => (
          <BlogPostCard
            key={post.id}
            post={post as BlogPost}
            locale={locale}
            featured={index === 0}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isKa ? 'იტვირთება...' : 'Loading...'}
              </>
            ) : (
              isKa ? 'მეტის ჩატვირთვა' : 'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
