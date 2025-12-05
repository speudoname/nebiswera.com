import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/courses/[id]/enrollments/bulk - Bulk enroll users
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { emails, expiresAt } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return badRequestResponse('Emails array is required')
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, settings: true },
    })

    if (!course) {
      return badRequestResponse('Course not found')
    }

    // Calculate expiration
    let calculatedExpiresAt = expiresAt ? new Date(expiresAt) : null
    if (!calculatedExpiresAt) {
      const settings = course.settings as { expirationDays?: number | null } | null
      if (settings?.expirationDays) {
        calculatedExpiresAt = new Date()
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + settings.expirationDays)
      }
    }

    // Find all users by email
    const users = await prisma.user.findMany({
      where: {
        email: { in: emails.map((e: string) => e.toLowerCase().trim()) },
      },
      select: { id: true, email: true },
    })

    const userByEmail = new Map(users.map(u => [u.email.toLowerCase(), u]))

    // Find existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        userId: { in: users.map(u => u.id) },
      },
      select: { userId: true },
    })

    const alreadyEnrolledIds = new Set(existingEnrollments.map(e => e.userId))

    // Process results
    const results = {
      success: [] as string[],
      alreadyEnrolled: [] as string[],
      notFound: [] as string[],
    }

    const toEnroll: { courseId: string; userId: string; expiresAt: Date | null }[] = []

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim()
      const user = userByEmail.get(normalizedEmail)

      if (!user) {
        results.notFound.push(email)
      } else if (alreadyEnrolledIds.has(user.id)) {
        results.alreadyEnrolled.push(email)
      } else {
        toEnroll.push({
          courseId,
          userId: user.id,
          expiresAt: calculatedExpiresAt,
        })
        results.success.push(email)
      }
    }

    // Bulk create enrollments
    if (toEnroll.length > 0) {
      await prisma.enrollment.createMany({
        data: toEnroll,
      })
    }

    return successResponse({
      enrolled: results.success.length,
      alreadyEnrolled: results.alreadyEnrolled.length,
      notFound: results.notFound.length,
      details: results,
    })
  } catch (error) {
    logger.error('Failed to bulk enroll:', error)
    return errorResponse('Failed to bulk enroll')
  }
}
