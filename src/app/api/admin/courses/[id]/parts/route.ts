import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/parts - List all parts for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId')

  try {
    const where: Record<string, unknown> = {}

    if (lessonId) {
      where.lessonId = lessonId
    } else {
      // Get all parts for the course through lessons
      where.lesson = {
        courseId,
      }
    }

    const parts = await prisma.lmsPart.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return successResponse(parts)
  } catch (error) {
    logger.error('Failed to fetch parts:', error)
    return errorResponse('Failed to fetch parts')
  }
}

// POST /api/admin/courses/[id]/parts - Create new part
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { title, description, lessonId, contentBlocks } = body

    if (!title) {
      return badRequestResponse('Title is required')
    }

    if (!lessonId) {
      return badRequestResponse('Lesson ID is required')
    }

    // Verify lesson exists and belongs to this course
    const lesson = await prisma.lmsLesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    })

    if (!lesson || lesson.courseId !== courseId) {
      return badRequestResponse('Invalid lesson')
    }

    // Get the next order number
    const lastPart = await prisma.lmsPart.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const part = await prisma.lmsPart.create({
      data: {
        lessonId,
        title,
        description: description || null,
        order: (lastPart?.order ?? -1) + 1,
        contentBlocks: contentBlocks || [],
      },
    })

    return successResponse(part, 201)
  } catch (error) {
    logger.error('Failed to create part:', error)
    return errorResponse('Failed to create part')
  }
}
