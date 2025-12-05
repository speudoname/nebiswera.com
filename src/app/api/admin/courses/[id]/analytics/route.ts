import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, successResponse, errorResponse } from '@/lib'
import { prisma } from '@/lib/db'
import type { NextRequest } from 'next/server'
import {
  getAdminDashboardStats,
  getEnrollmentTrends,
  getCompletionTrends,
  getContentEngagement,
  getQuizStats,
  getRecentActivity,
  getTopStudents,
} from '@/app/api/courses/lib/analytics'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/analytics
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)

  // Check which data to fetch
  const view = searchParams.get('view') || 'overview'
  const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, all
  const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month'

  try {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Calculate date range
    let dateRange: { start: Date; end: Date } | undefined
    if (period !== 'all') {
      const end = new Date()
      const start = new Date()
      if (period === '7d') {
        start.setDate(start.getDate() - 7)
      } else if (period === '30d') {
        start.setDate(start.getDate() - 30)
      } else if (period === '90d') {
        start.setDate(start.getDate() - 90)
      }
      dateRange = { start, end }
    }

    // Return data based on view
    if (view === 'overview') {
      const stats = await getAdminDashboardStats(courseId)
      return successResponse({ stats })
    }

    if (view === 'trends') {
      const [enrollments, completions] = await Promise.all([
        getEnrollmentTrends(courseId, dateRange, groupBy),
        getCompletionTrends(courseId, dateRange, groupBy),
      ])
      return successResponse({ enrollments, completions })
    }

    if (view === 'engagement') {
      const engagement = await getContentEngagement(courseId)
      return successResponse({ engagement })
    }

    if (view === 'quizzes') {
      const quizzes = await getQuizStats(courseId)
      return successResponse({ quizzes })
    }

    if (view === 'activity') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const activity = await getRecentActivity(courseId, limit)
      return successResponse({ activity })
    }

    if (view === 'students') {
      const limit = parseInt(searchParams.get('limit') || '20')
      const students = await getTopStudents(courseId, limit)
      return successResponse({ students })
    }

    // Full dashboard data
    if (view === 'full') {
      const [
        stats,
        enrollmentTrends,
        completionTrends,
        engagement,
        quizzes,
        recentActivity,
        topStudents,
      ] = await Promise.all([
        getAdminDashboardStats(courseId),
        getEnrollmentTrends(courseId, dateRange, groupBy),
        getCompletionTrends(courseId, dateRange, groupBy),
        getContentEngagement(courseId),
        getQuizStats(courseId),
        getRecentActivity(courseId, 10),
        getTopStudents(courseId, 5),
      ])

      return successResponse({
        stats,
        trends: {
          enrollments: enrollmentTrends,
          completions: completionTrends,
        },
        engagement,
        quizzes,
        recentActivity,
        topStudents,
      })
    }

    return successResponse({ message: 'Unknown view' })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return errorResponse('Failed to fetch analytics')
  }
}
