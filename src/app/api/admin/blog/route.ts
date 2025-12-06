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
    let slugKa = body.slugKa || (body.titleKa ? generateSlug(body.titleKa) : '')
    let slugEn = body.slugEn || (body.titleEn ? generateSlug(body.titleEn) : '')

    // Check for slug conflicts and generate unique slugs if needed
    const existingSlugs = await prisma.blogPost.findMany({
      where: {
        OR: [
          { slugKa: { startsWith: slugKa } },
          { slugEn: { startsWith: slugEn } },
        ],
      },
      select: { slugKa: true, slugEn: true },
    })

    // Make slugs unique if conflicts exist
    if (existingSlugs.some((p) => p.slugKa === slugKa)) {
      const existingKaSlugs = existingSlugs.map((p) => p.slugKa)
      let counter = 2
      while (existingKaSlugs.includes(`${slugKa}-${counter}`)) {
        counter++
      }
      slugKa = `${slugKa}-${counter}`
    }

    if (existingSlugs.some((p) => p.slugEn === slugEn)) {
      const existingEnSlugs = existingSlugs.map((p) => p.slugEn)
      let counter = 2
      while (existingEnSlugs.includes(`${slugEn}-${counter}`)) {
        counter++
      }
      slugEn = `${slugEn}-${counter}`
    }

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
        publishedKa: body.publishedKa ?? false,
        publishedEn: body.publishedEn ?? false,
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

