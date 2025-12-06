import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { generateSlug } from '@/lib/utils/transliterate'
import { calculateReadingTime, extractExcerpt } from '@/lib/utils/reading-time'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

// GET /api/admin/blog - List all blog posts
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(posts)
  } catch (error) {
    logger.error('Error fetching blog posts:', error)
    return errorResponse('Failed to fetch blog posts')
  }
}

// POST /api/admin/blog - Create new blog post
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const token = await getAuthToken(request)
    const body = await request.json()

    // Generate slugs from titles if not provided
    const slugKa = body.slugKa || (body.titleKa ? generateSlug(body.titleKa) : '')
    const slugEn = body.slugEn || (body.titleEn ? generateSlug(body.titleEn) : '')

    // Calculate reading time from content
    const readingTimeMinutes = calculateReadingTime(body.contentKa || body.contentEn || '')

    const post = await prisma.blogPost.create({
      data: {
        slugKa,
        slugEn,
        titleKa: body.titleKa,
        titleEn: body.titleEn,
        excerptKa: body.excerptKa || extractExcerpt(body.contentKa || ''),
        excerptEn: body.excerptEn || extractExcerpt(body.contentEn || ''),
        contentKa: body.contentKa,
        contentEn: body.contentEn,
        featuredImage: body.featuredImage,
        featuredImageAlt: body.featuredImageAlt,
        seoTitleKa: body.seoTitleKa,
        seoDescriptionKa: body.seoDescriptionKa,
        ogImageKa: body.ogImageKa,
        seoTitleEn: body.seoTitleEn,
        seoDescriptionEn: body.seoDescriptionEn,
        ogImageEn: body.ogImageEn,
        category: body.category,
        tags: body.tags || [],
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
        authorId: token?.sub,
        authorName: body.authorName || (token?.name as string),
        authorAvatar: body.authorAvatar,
        readingTimeMinutes,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    logger.error('Error creating blog post:', error)
    return errorResponse('Failed to create blog post')
  }
}

