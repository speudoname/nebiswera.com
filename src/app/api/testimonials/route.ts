// API route for testimonials (admin and public)
import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { Prisma, TestimonialSource } from '@prisma/client'
import { logger, errorResponse, badRequestResponse } from '@/lib'
import { checkRateLimit } from '@/lib/rate-limit'

// GET /api/testimonials - List testimonials (admin with all, public with approved only)
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | null
    const type = searchParams.get('type') as 'TEXT' | 'AUDIO' | 'VIDEO' | null
    const search = searchParams.get('search') || ''
    const tags = searchParams.get('tags') || ''

    const isAdmin = token?.role === 'ADMIN'

    const where: Prisma.TestimonialWhereInput = {}

    // Admin can see all testimonials, non-admins only see APPROVED
    if (isAdmin) {
      // Admin: filter by status if explicitly provided, otherwise show all
      if (status) {
        where.status = status
      }
      // If no status param or empty, show all statuses for admin
    } else {
      // Non-admin: always show only APPROVED
      where.status = 'APPROVED'
    }

    if (type) where.type = type

    // Filter by tags (array contains)
    if (tags) {
      where.tags = {
        has: tags
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { text: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.testimonial.count({ where }),
    ])

    const response = NextResponse.json({
      testimonials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

    // Prevent caching of API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error: unknown) {
    logger.error('Error fetching testimonials:', error)
    return errorResponse('Failed to fetch testimonials')
  }
}

// POST /api/testimonials - Submit new testimonial (public)
export async function POST(request: NextRequest) {
  // Rate limiting - 5 submissions per hour per IP
  const rateLimitResponse = await checkRateLimit(request, 'registration')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.text) {
      return badRequestResponse('Missing required fields: name, email, text')
    }

    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        name: body.name,
        email: body.email,
        text: body.text,
        rating: body.rating || 5,
        locale: body.locale || 'ka',
        profilePhoto: body.profilePhoto || null,
        images: body.images || [],
        audioUrl: body.audioUrl || null,
        videoUrl: body.videoUrl || null,
        type: body.type || 'TEXT',
        status: 'PENDING', // All submissions start as pending
        source: TestimonialSource.WEBSITE_FORM,
      },
    })

    return NextResponse.json({ success: true, testimonial }, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating testimonial:', error)
    return errorResponse('Failed to create testimonial')
  }
}
