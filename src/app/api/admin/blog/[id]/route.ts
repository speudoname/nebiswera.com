import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { calculateReadingTime } from '@/lib/utils/reading-time'

// GET /api/admin/blog/[id] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog/[id] - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Get the existing post to check for status changes
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Calculate reading time if content changed
    const readingTimeMinutes =
      body.contentKa !== existingPost.contentKa ||
      body.contentEn !== existingPost.contentEn
        ? calculateReadingTime(body.contentKa || body.contentEn)
        : existingPost.readingTimeMinutes

    // Update publishedAt if status changed to PUBLISHED
    let publishedAt = existingPost.publishedAt
    if (body.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      publishedAt = new Date()
    } else if (body.status !== 'PUBLISHED') {
      publishedAt = null
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        slugKa: body.slugKa,
        slugEn: body.slugEn,
        titleKa: body.titleKa,
        titleEn: body.titleEn,
        excerptKa: body.excerptKa,
        excerptEn: body.excerptEn,
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
        status: body.status,
        publishedAt,
        publishedKa: body.publishedKa ?? false,
        publishedEn: body.publishedEn ?? false,
        authorName: body.authorName,
        authorAvatar: body.authorAvatar,
        readingTimeMinutes,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/[id] - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.blogPost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}

