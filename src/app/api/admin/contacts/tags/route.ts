import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { DEFAULT_TAG_COLOR } from '@/lib/constants'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { createTagSchema, formatZodError } from '@/lib/validations'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  })

  return NextResponse.json(
    tags.map((tag) => ({
      ...tag,
      contactCount: tag._count.contacts,
    }))
  )
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    // Validate input
    const parsed = createTagSchema.safeParse(body)
    if (!parsed.success) {
      return badRequestResponse(formatZodError(parsed.error))
    }

    const { name, color, description } = parsed.data

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    })

    if (existingTag) {
      return badRequestResponse('A tag with this name already exists')
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || DEFAULT_TAG_COLOR,
        description,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    logger.error('Failed to create tag:', error)
    return errorResponse('Failed to create tag')
  }
}
