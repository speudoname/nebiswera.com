// API route for individual testimonial operations
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { Prisma, VideoProcessingStatus } from '@prisma/client'
import { logger, notFoundResponse, unauthorizedResponse, errorResponse } from '@/lib'

// GET /api/testimonials/[id] - Get single testimonial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getAuthToken(request)

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!testimonial) {
      return notFoundResponse('Testimonial not found')
    }

    // Non-admin users can only see approved testimonials
    if (testimonial.status !== 'APPROVED' && token?.role !== 'ADMIN') {
      return notFoundResponse()
    }

    return NextResponse.json({ testimonial })
  } catch (error: unknown) {
    logger.error('Error fetching testimonial:', error)
    return errorResponse('Failed to fetch testimonial')
  }
}

// PUT /api/testimonials/[id] - Update testimonial (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
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
    return errorResponse('Failed to update testimonial')
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
    const updateData: Prisma.TestimonialUpdateInput = {}

    if (body.profilePhoto !== undefined) updateData.profilePhoto = body.profilePhoto
    if (body.images !== undefined) updateData.images = body.images
    if (body.audioUrl !== undefined) updateData.audioUrl = body.audioUrl
    if (body.videoUrl !== undefined) {
      updateData.videoUrl = body.videoUrl
      // Bunny handles transcoding automatically - video is processing/ready
      if (body.videoUrl) {
        updateData.videoStatus = VideoProcessingStatus.READY
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
    return errorResponse('Failed to update testimonial')
  }
}

// DELETE /api/testimonials/[id] - Delete testimonial (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { id } = await params

    await prisma.testimonial.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Error deleting testimonial:', error)
    return errorResponse('Failed to delete testimonial')
  }
}
