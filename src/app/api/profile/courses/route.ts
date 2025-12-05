import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib'

// GET /api/profile/courses - Get user's enrolled courses with progress
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorizedResponse('You must be logged in')
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            locale: true,
            accessType: true,
            status: true,
            settings: true,
            modules: {
              select: {
                id: true,
                lessons: {
                  select: {
                    id: true,
                    parts: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
            lessons: {
              where: { moduleId: null },
              select: {
                id: true,
                parts: {
                  select: { id: true },
                },
              },
            },
          },
        },
        partProgress: {
          select: {
            partId: true,
            status: true,
            lastAccessedAt: true,
          },
          orderBy: {
            lastAccessedAt: 'desc',
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    // Transform data for frontend
    const courses = enrollments.map((enrollment) => {
      const course = enrollment.course

      // Calculate total parts
      let totalParts = 0
      const allPartIds: string[] = []

      // Parts from modules -> lessons -> parts
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          totalParts += lesson.parts.length
          allPartIds.push(...lesson.parts.map((p) => p.id))
        }
      }

      // Parts from direct lessons -> parts
      for (const lesson of course.lessons) {
        totalParts += lesson.parts.length
        allPartIds.push(...lesson.parts.map((p) => p.id))
      }

      // Calculate completed parts
      const completedParts = enrollment.partProgress.filter(
        (p) => p.status === 'COMPLETED'
      ).length

      // Find last accessed part
      const lastProgress = enrollment.partProgress[0]
      const lastAccessedPartId = lastProgress?.partId || null
      const lastAccessedAt = lastProgress?.lastAccessedAt || enrollment.enrolledAt

      // Find first incomplete part for resume
      const completedPartIds = new Set(
        enrollment.partProgress
          .filter((p) => p.status === 'COMPLETED')
          .map((p) => p.partId)
      )
      const resumePartId = allPartIds.find((id) => !completedPartIds.has(id)) || allPartIds[0]

      return {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        status: enrollment.status,
        expiresAt: enrollment.expiresAt,
        certificateUrl: enrollment.certificateUrl,
        certificateIssuedAt: enrollment.certificateIssuedAt,
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          locale: course.locale,
          accessType: course.accessType,
        },
        progress: {
          percent: enrollment.progressPercent,
          completedParts,
          totalParts,
          lastAccessedAt,
          lastAccessedPartId,
          resumePartId,
        },
      }
    })

    return successResponse({ courses })
  } catch (error) {
    console.error('Failed to fetch enrolled courses:', error)
    return errorResponse('Failed to fetch courses')
  }
}
