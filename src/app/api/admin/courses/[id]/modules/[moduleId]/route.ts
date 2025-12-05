import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; moduleId: string }>
}

// GET /api/admin/courses/[id]/modules/[moduleId] - Get single module
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { moduleId } = await params

  try {
    const module = await prisma.lmsModule.findUnique({
      where: { id: moduleId },
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

    if (!module) {
      return notFoundResponse('Module not found')
    }

    return successResponse(module)
  } catch (error) {
    logger.error('Failed to fetch module:', error)
    return errorResponse('Failed to fetch module')
  }
}

// PUT /api/admin/courses/[id]/modules/[moduleId] - Update module
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { moduleId } = await params

  try {
    const body = await request.json()
    const { title, description, order, availableAfterDays, contentBlocks } = body

    const existing = await prisma.lmsModule.findUnique({
      where: { id: moduleId },
      select: { id: true },
    })

    if (!existing) {
      return notFoundResponse('Module not found')
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (availableAfterDays !== undefined) updateData.availableAfterDays = availableAfterDays
    if (contentBlocks !== undefined) updateData.contentBlocks = contentBlocks

    const module = await prisma.lmsModule.update({
      where: { id: moduleId },
      data: updateData,
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

    return successResponse(module)
  } catch (error) {
    logger.error('Failed to update module:', error)
    return errorResponse('Failed to update module')
  }
}

// DELETE /api/admin/courses/[id]/modules/[moduleId] - Delete module
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { moduleId } = await params

  try {
    const module = await prisma.lmsModule.findUnique({
      where: { id: moduleId },
      select: { id: true, courseId: true, order: true },
    })

    if (!module) {
      return notFoundResponse('Module not found')
    }

    // Delete the module (cascade will delete lessons and parts)
    await prisma.lmsModule.delete({
      where: { id: moduleId },
    })

    // Reorder remaining modules
    await prisma.lmsModule.updateMany({
      where: {
        courseId: module.courseId,
        order: { gt: module.order },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete module:', error)
    return errorResponse('Failed to delete module')
  }
}
