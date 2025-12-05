import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/courses/[id]/reorder - Reorder modules, lessons, or parts
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { type, items } = body

    // type: 'modules' | 'lessons' | 'parts'
    // items: Array of { id: string, order: number, parentId?: string }

    if (!type || !Array.isArray(items)) {
      return badRequestResponse('Invalid request: type and items array required')
    }

    switch (type) {
      case 'modules':
        // Update module orders
        await Promise.all(
          items.map((item: { id: string; order: number }) =>
            prisma.lmsModule.update({
              where: { id: item.id },
              data: { order: item.order },
            })
          )
        )
        break

      case 'lessons':
        // Update lesson orders and optionally move between modules
        await Promise.all(
          items.map((item: { id: string; order: number; moduleId?: string | null }) =>
            prisma.lmsLesson.update({
              where: { id: item.id },
              data: {
                order: item.order,
                moduleId: item.moduleId !== undefined ? item.moduleId : undefined,
              },
            })
          )
        )
        break

      case 'parts':
        // Update part orders and optionally move between lessons
        await Promise.all(
          items.map((item: { id: string; order: number; lessonId?: string }) =>
            prisma.lmsPart.update({
              where: { id: item.id },
              data: {
                order: item.order,
                lessonId: item.lessonId !== undefined ? item.lessonId : undefined,
              },
            })
          )
        )
        break

      default:
        return badRequestResponse('Invalid type: must be modules, lessons, or parts')
    }

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to reorder items:', error)
    return errorResponse('Failed to reorder items')
  }
}
