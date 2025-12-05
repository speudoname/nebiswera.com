import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; lessonId: string }>
}

// GET /api/admin/courses/[id]/lessons/[lessonId] - Get single lesson
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { lessonId } = await params

  try {
    const lesson = await prisma.lmsLesson.findUnique({
      where: { id: lessonId },
      include: {
        parts: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!lesson) {
      return notFoundResponse('Lesson not found')
    }

    return successResponse(lesson)
  } catch (error) {
    logger.error('Failed to fetch lesson:', error)
    return errorResponse('Failed to fetch lesson')
  }
}

// PUT /api/admin/courses/[id]/lessons/[lessonId] - Update lesson
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { lessonId } = await params

  try {
    const body = await request.json()
    const { title, description, moduleId, order, availableAfterDays, contentBlocks } = body

    const existing = await prisma.lmsLesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    })

    if (!existing) {
      return notFoundResponse('Lesson not found')
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (moduleId !== undefined) updateData.moduleId = moduleId
    if (order !== undefined) updateData.order = order
    if (availableAfterDays !== undefined) updateData.availableAfterDays = availableAfterDays
    if (contentBlocks !== undefined) updateData.contentBlocks = contentBlocks

    const lesson = await prisma.lmsLesson.update({
      where: { id: lessonId },
      data: updateData,
      include: {
        parts: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse(lesson)
  } catch (error) {
    logger.error('Failed to update lesson:', error)
    return errorResponse('Failed to update lesson')
  }
}

// DELETE /api/admin/courses/[id]/lessons/[lessonId] - Delete lesson
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { lessonId } = await params

  try {
    const lesson = await prisma.lmsLesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true, moduleId: true, order: true },
    })

    if (!lesson) {
      return notFoundResponse('Lesson not found')
    }

    // Delete the lesson (cascade will delete parts)
    await prisma.lmsLesson.delete({
      where: { id: lessonId },
    })

    // Reorder remaining lessons in the same context
    await prisma.lmsLesson.updateMany({
      where: {
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        order: { gt: lesson.order },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete lesson:', error)
    return errorResponse('Failed to delete lesson')
  }
}
