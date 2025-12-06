import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'
import { SmsTemplateCategory } from '@prisma/client'

/**
 * GET /api/admin/sms/templates
 * List all SMS templates
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as SmsTemplateCategory | null

    const where = category ? { category } : {}

    const templates = await prisma.smsTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    logger.error('Error fetching SMS templates:', error)
    return errorResponse('Failed to fetch SMS templates')
  }
}

/**
 * POST /api/admin/sms/templates
 * Create a new SMS template
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const {
      name,
      slug,
      messageKa,
      messageEn,
      category,
      description,
    } = body

    // Validate required fields
    if (!name || !slug || !messageKa || !messageEn || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, messageKa, messageEn, category' },
        { status: 400 }
      )
    }

    // Check for slug uniqueness
    const existing = await prisma.smsTemplate.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A template with this slug already exists' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['WEBINAR', 'COURSE', 'AUTH', 'MARKETING', 'TRANSACTIONAL']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    const template = await prisma.smsTemplate.create({
      data: {
        name,
        slug,
        messageKa,
        messageEn,
        category,
        description: description || null,
        isDefault: false,
        isActive: true,
      },
    })

    logger.info('SMS template created:', { id: template.id, slug: template.slug })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    logger.error('Error creating SMS template:', error)
    return errorResponse('Failed to create SMS template')
  }
}
