import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/modules - List modules for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const modules = await prisma.lmsModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            parts: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return successResponse(modules)
  } catch (error) {
    logger.error('Failed to fetch modules:', error)
    return errorResponse('Failed to fetch modules')
  }
}

// POST /api/admin/courses/[id]/modules - Create new module
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { title, description, availableAfterDays, contentBlocks } = body

    if (!title) {
      return badRequestResponse('Title is required')
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Get the next order number
    const lastModule = await prisma.lmsModule.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const module = await prisma.lmsModule.create({
      data: {
        courseId,
        title,
        description: description || null,
        order: (lastModule?.order ?? -1) + 1,
        availableAfterDays: availableAfterDays || null,
        contentBlocks: contentBlocks || [],
      },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            parts: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return successResponse(module, 201)
  } catch (error) {
    logger.error('Failed to create module:', error)
    return errorResponse('Failed to create module')
  }
}
