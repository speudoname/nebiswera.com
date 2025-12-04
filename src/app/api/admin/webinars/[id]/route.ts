import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { WebinarStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id] - Get webinar details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      include: {
        scheduleConfig: true,
        _count: {
          select: {
            registrations: true,
            sessions: true,
            interactions: true,
            notifications: true,
            chatMessages: true,
          },
        },
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    return NextResponse.json(webinar)
  } catch (error) {
    console.error('Failed to fetch webinar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webinar' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/webinars/[id] - Update webinar
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if webinar exists
    const existing = await prisma.webinar.findUnique({
      where: { id },
      select: { status: true, slug: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      description,
      videoDuration,
      thumbnailUrl,
      hlsUrl,
      videoStatus,
      status,
      timezone,
      presenterName,
      presenterTitle,
      presenterAvatar,
      presenterBio,
      completionPercent,
    } = body

    // Build update data - only include fields that were provided
    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (videoDuration !== undefined) updateData.videoDuration = videoDuration
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (hlsUrl !== undefined) updateData.hlsUrl = hlsUrl
    if (videoStatus !== undefined) updateData.videoStatus = videoStatus
    if (timezone !== undefined) updateData.timezone = timezone
    if (presenterName !== undefined) updateData.presenterName = presenterName
    if (presenterTitle !== undefined) updateData.presenterTitle = presenterTitle
    if (presenterAvatar !== undefined) updateData.presenterAvatar = presenterAvatar
    if (presenterBio !== undefined) updateData.presenterBio = presenterBio
    if (completionPercent !== undefined) updateData.completionPercent = completionPercent

    // Handle slug change - check for uniqueness
    if (slug !== undefined && slug !== existing.slug) {
      const slugExists = await prisma.webinar.findFirst({
        where: { slug, id: { not: id } },
        select: { id: true },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
      updateData.slug = slug
    }

    // Handle status change
    if (status !== undefined) {
      const validStatuses: WebinarStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set publishedAt when publishing for the first time
      if (status === 'PUBLISHED' && existing.status === 'DRAFT') {
        updateData.publishedAt = new Date()
      }
    }

    const webinar = await prisma.webinar.update({
      where: { id },
      data: updateData,
      include: {
        scheduleConfig: true,
        _count: {
          select: {
            registrations: true,
            sessions: true,
            interactions: true,
          },
        },
      },
    })

    return NextResponse.json(webinar)
  } catch (error) {
    console.error('Failed to update webinar:', error)
    return NextResponse.json(
      { error: 'Failed to update webinar' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/webinars/[id] - Delete webinar
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if webinar exists
    const existing = await prisma.webinar.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Only allow deleting DRAFT or ARCHIVED webinars
    if (!['DRAFT', 'ARCHIVED'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Can only delete draft or archived webinars. Archive it first.' },
        { status: 400 }
      )
    }

    // Delete the webinar (cascade will handle related records)
    await prisma.webinar.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete webinar:', error)
    return NextResponse.json(
      { error: 'Failed to delete webinar' },
      { status: 500 }
    )
  }
}
