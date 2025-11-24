// API route for testimonials (admin and public)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/testimonials - List testimonials (admin with all, public with approved only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | null
    const type = searchParams.get('type') as 'TEXT' | 'AUDIO' | 'VIDEO' | null
    const search = searchParams.get('search') || ''

    const isAdmin = session?.user?.role === 'ADMIN'

    const where: any = {}

    // Non-admin users only see approved
    if (!isAdmin) {
      where.status = 'APPROVED'
    } else {
      // Admin can filter by status
      if (status) where.status = status
    }

    if (type) where.type = type
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

    return NextResponse.json({
      testimonials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

// POST /api/testimonials - Submit new testimonial (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.text) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, text' },
        { status: 400 }
      )
    }

    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role || null,
        company: body.company || null,
        text: body.text,
        rating: body.rating || 5,
        locale: body.locale || 'ka',
        profilePhoto: body.profilePhoto || null,
        images: body.images || [],
        audioUrl: body.audioUrl || null,
        videoUrl: body.videoUrl || null,
        type: body.type || 'TEXT',
        status: 'PENDING', // All submissions start as pending
        source: 'website_form',
      },
    })

    return NextResponse.json({ success: true, testimonial }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}
