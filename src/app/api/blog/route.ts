import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'

const POSTS_PER_PAGE = 10

// GET /api/blog - Public blog posts with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'ka'
    const cursor = searchParams.get('cursor') // Post ID for cursor-based pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || String(POSTS_PER_PAGE)), 50)

    const isKa = locale === 'ka'

    // Build the where clause
    const where = {
      status: 'PUBLISHED' as const,
      ...(isKa ? { publishedKa: true } : { publishedEn: true }),
    }

    // Fetch posts with cursor-based pagination
    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
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

    // Filter posts that have content in the requested locale
    const postsWithContent = posts.filter((post) => {
      const title = isKa ? post.titleKa : post.titleEn
      const slug = isKa ? post.slugKa : post.slugEn
      return title && slug
    })

    // Check if there are more posts
    const hasMore = postsWithContent.length > limit
    const returnPosts = hasMore ? postsWithContent.slice(0, limit) : postsWithContent

    // Get next cursor
    const nextCursor = hasMore ? returnPosts[returnPosts.length - 1]?.id : null

    return NextResponse.json({
      posts: returnPosts,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    logger.error('Error fetching public blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}
