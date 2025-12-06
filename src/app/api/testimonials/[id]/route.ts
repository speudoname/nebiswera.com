// API route for individual testimonial operations
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { Prisma, VideoProcessingStatus } from '@prisma/client'
import { logger, notFoundResponse, unauthorizedResponse, errorResponse, badRequestResponse } from '@/lib'
import { updateTestimonialSchema, patchTestimonialSchema, formatZodError } from '@/lib/validations'

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

    // Check if testimonial exists
    const existing = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('Testimonial not found')
    }

    const body = await request.json()

    // Validate input
    const parsed = updateTestimonialSchema.safeParse(body)
    if (!parsed.success) {
      return badRequestResponse(formatZodError(parsed.error))
    }

    const { name, email, text, rating, locale, status, type, tags } = parsed.data

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name,
        email,
        text,
        rating,
        locale,
        status,
        type,
        tags: tags || [],
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

    // Check if testimonial exists
    const existing = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('Testimonial not found')
    }

    const body = await request.json()

    // Validate input
    const parsed = patchTestimonialSchema.safeParse(body)
    if (!parsed.success) {
      return badRequestResponse(formatZodError(parsed.error))
    }

    const { profilePhoto, images, audioUrl, videoUrl, videoThumbnail, type } = parsed.data

    // Build partial update data
    const updateData: Prisma.TestimonialUpdateInput = {}

    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto
    if (images !== undefined) updateData.images = images
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl
      // Bunny handles transcoding automatically - video is processing/ready
      if (videoUrl) {
        updateData.videoStatus = VideoProcessingStatus.READY
      }
    }
    if (videoThumbnail !== undefined) updateData.videoThumbnail = videoThumbnail
    if (type !== undefined) updateData.type = type

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

    // Check if testimonial exists
    const existing = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('Testimonial not found')
    }

    await prisma.testimonial.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Error deleting testimonial:', error)
    return errorResponse('Failed to delete testimonial')
  }
}
