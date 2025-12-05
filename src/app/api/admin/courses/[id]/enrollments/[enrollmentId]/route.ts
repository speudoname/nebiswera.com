import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import type { EnrollmentStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; enrollmentId: string }>
}

// GET /api/admin/courses/[id]/enrollments/[enrollmentId] - Get enrollment with full progress
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { enrollmentId } = await params

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            settings: true,
          },
        },
        partProgress: {
          include: {
            part: {
              select: {
                id: true,
                title: true,
                order: true,
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    order: true,
                    module: {
                      select: {
                        id: true,
                        title: true,
                        order: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { lastAccessedAt: 'desc' },
        },
      },
    })

    if (!enrollment) {
      return notFoundResponse('Enrollment not found')
    }

    // Get quiz attempts for this user and course
    const quizAttempts = await prisma.lmsQuizAttempt.findMany({
      where: {
        userId: enrollment.userId,
        quiz: {
          courseId: enrollment.courseId,
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    return successResponse({
      ...enrollment,
      quizAttempts,
    })
  } catch (error) {
    logger.error('Failed to fetch enrollment:', error)
    return errorResponse('Failed to fetch enrollment')
  }
}

// PUT /api/admin/courses/[id]/enrollments/[enrollmentId] - Update enrollment status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { enrollmentId } = await params

  try {
    const body = await request.json()
    const { status, expiresAt, progressPercent, completedAt } = body

    const existing = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, status: true },
    })

    if (!existing) {
      return notFoundResponse('Enrollment not found')
    }

    // Validate status
    const validStatuses: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'EXPIRED', 'SUSPENDED']
    if (status && !validStatuses.includes(status)) {
      return badRequestResponse('Invalid status')
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null

    // If marking as completed and no completedAt, set it now
    if (status === 'COMPLETED' && !completedAt && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date()
      updateData.progressPercent = 100
    }

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return successResponse(enrollment)
  } catch (error) {
    logger.error('Failed to update enrollment:', error)
    return errorResponse('Failed to update enrollment')
  }
}

// DELETE /api/admin/courses/[id]/enrollments/[enrollmentId] - Remove enrollment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { enrollmentId } = await params

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true },
    })

    if (!enrollment) {
      return notFoundResponse('Enrollment not found')
    }

    // Delete enrollment (cascade will delete progress)
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete enrollment:', error)
    return errorResponse('Failed to delete enrollment')
  }
}
