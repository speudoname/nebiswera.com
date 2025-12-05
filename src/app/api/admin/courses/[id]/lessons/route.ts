import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/lessons - List all lessons for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('moduleId')

  try {
    const where: Record<string, unknown> = { courseId }
    if (moduleId === 'null') {
      where.moduleId = null // Direct lessons only
    } else if (moduleId) {
      where.moduleId = moduleId
    }

    const lessons = await prisma.lmsLesson.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        parts: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse(lessons)
  } catch (error) {
    logger.error('Failed to fetch lessons:', error)
    return errorResponse('Failed to fetch lessons')
  }
}

// POST /api/admin/courses/[id]/lessons - Create new lesson
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { title, description, moduleId, availableAfterDays, contentBlocks } = body

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

    // If moduleId is provided, verify it exists and belongs to this course
    if (moduleId) {
      const module = await prisma.lmsModule.findUnique({
        where: { id: moduleId },
        select: { courseId: true },
      })
      if (!module || module.courseId !== courseId) {
        return badRequestResponse('Invalid module')
      }
    }

    // Get the next order number within the module/course
    const lastLesson = await prisma.lmsLesson.findFirst({
      where: {
        courseId,
        moduleId: moduleId || null,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const lesson = await prisma.lmsLesson.create({
      data: {
        courseId,
        moduleId: moduleId || null,
        title,
        description: description || null,
        order: (lastLesson?.order ?? -1) + 1,
        availableAfterDays: availableAfterDays || null,
        contentBlocks: contentBlocks || [],
      },
      include: {
        parts: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse(lesson, 201)
  } catch (error) {
    logger.error('Failed to create lesson:', error)
    return errorResponse('Failed to create lesson')
  }
}
