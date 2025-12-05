import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/courses/[id]/publish - Publish or unpublish course
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { action } = body // 'publish' or 'unpublish' or 'archive'

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                parts: true,
              },
            },
          },
        },
        lessons: {
          where: { moduleId: null },
          include: {
            parts: true,
          },
        },
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    if (action === 'publish') {
      // Validate course has content before publishing
      const hasContent =
        course.modules.some(m => m.lessons.some(l => l.parts.length > 0)) ||
        course.lessons.some(l => l.parts.length > 0)

      if (!hasContent) {
        return badRequestResponse('Course must have at least one part with content before publishing')
      }

      const updated = await prisma.course.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: course.publishedAt || new Date(),
          version: course.version + 1,
        },
      })

      return successResponse(updated)
    }

    if (action === 'unpublish') {
      const updated = await prisma.course.update({
        where: { id },
        data: {
          status: 'DRAFT',
        },
      })

      return successResponse(updated)
    }

    if (action === 'archive') {
      const updated = await prisma.course.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
        },
      })

      return successResponse(updated)
    }

    return badRequestResponse('Invalid action. Use "publish", "unpublish", or "archive"')
  } catch (error) {
    logger.error('Failed to update course status:', error)
    return errorResponse('Failed to update course status')
  }
}
