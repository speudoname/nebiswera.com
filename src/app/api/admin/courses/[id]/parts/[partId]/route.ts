import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; partId: string }>
}

// GET /api/admin/courses/[id]/parts/[partId] - Get single part
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { partId } = await params

  try {
    const part = await prisma.lmsPart.findUnique({
      where: { id: partId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!part) {
      return notFoundResponse('Part not found')
    }

    return successResponse(part)
  } catch (error) {
    logger.error('Failed to fetch part:', error)
    return errorResponse('Failed to fetch part')
  }
}

// PUT /api/admin/courses/[id]/parts/[partId] - Update part
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { partId } = await params

  try {
    const body = await request.json()
    const { title, description, order, contentBlocks } = body

    const existing = await prisma.lmsPart.findUnique({
      where: { id: partId },
      select: { id: true },
    })

    if (!existing) {
      return notFoundResponse('Part not found')
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (contentBlocks !== undefined) updateData.contentBlocks = contentBlocks

    const part = await prisma.lmsPart.update({
      where: { id: partId },
      data: updateData,
    })

    return successResponse(part)
  } catch (error) {
    logger.error('Failed to update part:', error)
    return errorResponse('Failed to update part')
  }
}

// DELETE /api/admin/courses/[id]/parts/[partId] - Delete part
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { partId } = await params

  try {
    const part = await prisma.lmsPart.findUnique({
      where: { id: partId },
      select: { id: true, lessonId: true, order: true },
    })

    if (!part) {
      return notFoundResponse('Part not found')
    }

    // Delete the part
    await prisma.lmsPart.delete({
      where: { id: partId },
    })

    // Reorder remaining parts
    await prisma.lmsPart.updateMany({
      where: {
        lessonId: part.lessonId,
        order: { gt: part.order },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete part:', error)
    return errorResponse('Failed to delete part')
  }
}
