// API route for individual testimonial operations (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'

// GET /api/testimonials/[id] - Get single testimonial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    // Non-admin users can only see approved testimonials
    if (testimonial.status !== 'APPROVED' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ testimonial })
  } catch (error: unknown) {
    logger.error('Error fetching testimonial:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 })
  }
}

// PUT /api/testimonials/[id] - Update testimonial (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        text: body.text,
        rating: body.rating,
        locale: body.locale,
        status: body.status,
        type: body.type,
        tags: body.tags || [],
      },
    })

    return NextResponse.json({ success: true, testimonial })
  } catch (error: unknown) {
    logger.error('Error updating testimonial:', error)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

// PATCH /api/testimonials/[id] - Partial update testimonial (public for multi-step form)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Allow partial updates for any field
    const updateData: any = {}

    if (body.profilePhoto !== undefined) updateData.profilePhoto = body.profilePhoto
    if (body.images !== undefined) updateData.images = body.images
    if (body.audioUrl !== undefined) updateData.audioUrl = body.audioUrl
    if (body.videoUrl !== undefined) {
      updateData.videoUrl = body.videoUrl
      // Bunny handles transcoding automatically - video is processing/ready
      if (body.videoUrl) {
        updateData.videoStatus = 'ready'
      }
    }
    if (body.videoThumbnail !== undefined) updateData.videoThumbnail = body.videoThumbnail
    if (body.type !== undefined) updateData.type = body.type

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, testimonial })
  } catch (error: unknown) {
    logger.error('Error updating testimonial:', error)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

// DELETE /api/testimonials/[id] - Delete testimonial (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.testimonial.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Error deleting testimonial:', error)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
