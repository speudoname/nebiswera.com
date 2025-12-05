/**
 * LMS Course Analytics Library
 *
 * Functions for tracking and querying course analytics events
 */

import { prisma } from '@/lib/db'
import type { CourseEventType, Prisma } from '@prisma/client'

// ==========================================
// EVENT TRACKING
// ==========================================

interface TrackEventParams {
  courseId: string
  eventType: CourseEventType
  userId?: string | null
  anonymousId?: string | null
  enrollmentId?: string | null
  partId?: string | null
  lessonId?: string | null
  moduleId?: string | null
  quizId?: string | null
  eventData?: Record<string, unknown>
  userAgent?: string | null
  ipAddress?: string | null
}

/**
 * Track an analytics event
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  const {
    courseId,
    eventType,
    userId,
    anonymousId,
    enrollmentId,
    partId,
    lessonId,
    moduleId,
    quizId,
    eventData,
    userAgent,
    ipAddress,
  } = params

  await prisma.courseAnalyticsEvent.create({
    data: {
      courseId,
      eventType,
      userId,
      anonymousId,
      enrollmentId,
      partId,
      lessonId,
      moduleId,
      quizId,
      eventData: (eventData || {}) as Prisma.InputJsonValue,
      userAgent,
      ipAddress,
    },
  })
}

/**
 * Track enrollment event
 */
export async function trackEnrollment(
  courseId: string,
  userId: string,
  enrollmentId: string
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'ENROLLED',
    userId,
    enrollmentId,
  })
}

/**
 * Track course view
 */
export async function trackCourseView(
  courseId: string,
  userId?: string | null,
  anonymousId?: string | null,
  enrollmentId?: string | null
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'COURSE_VIEWED',
    userId,
    anonymousId,
    enrollmentId,
  })
}

/**
 * Track part view
 */
export async function trackPartView(
  courseId: string,
  partId: string,
  lessonId: string,
  moduleId?: string | null,
  userId?: string | null,
  anonymousId?: string | null,
  enrollmentId?: string | null
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'PART_VIEWED',
    userId,
    anonymousId,
    enrollmentId,
    partId,
    lessonId,
    moduleId,
  })
}

/**
 * Track video progress milestone
 */
export async function trackVideoProgress(
  courseId: string,
  partId: string,
  progressPercent: number,
  userId?: string | null,
  anonymousId?: string | null,
  enrollmentId?: string | null
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'VIDEO_PROGRESS',
    userId,
    anonymousId,
    enrollmentId,
    partId,
    eventData: { progressPercent },
  })
}

/**
 * Track video completion
 */
export async function trackVideoCompleted(
  courseId: string,
  partId: string,
  watchTimeSeconds: number,
  userId?: string | null,
  anonymousId?: string | null,
  enrollmentId?: string | null
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'VIDEO_COMPLETED',
    userId,
    anonymousId,
    enrollmentId,
    partId,
    eventData: { watchTimeSeconds },
  })
}

/**
 * Track part completion
 */
export async function trackPartCompleted(
  courseId: string,
  partId: string,
  lessonId: string,
  moduleId?: string | null,
  userId?: string | null,
  enrollmentId?: string | null
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'PART_COMPLETED',
    userId,
    enrollmentId,
    partId,
    lessonId,
    moduleId,
  })
}

/**
 * Track course completion
 */
export async function trackCourseCompleted(
  courseId: string,
  userId: string,
  enrollmentId: string,
  totalTimeMinutes?: number
): Promise<void> {
  await trackEvent({
    courseId,
    eventType: 'COURSE_COMPLETED',
    userId,
    enrollmentId,
    eventData: totalTimeMinutes ? { totalTimeMinutes } : {},
  })
}

/**
 * Track quiz events
 */
export async function trackQuizEvent(
  courseId: string,
  quizId: string,
  eventType: 'QUIZ_STARTED' | 'QUIZ_SUBMITTED' | 'QUIZ_PASSED' | 'QUIZ_FAILED' | 'QUIZ_RETRIED',
  userId?: string | null,
  enrollmentId?: string | null,
  eventData?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    courseId,
    eventType,
    userId,
    enrollmentId,
    quizId,
    eventData,
  })
}

// ==========================================
// ANALYTICS QUERIES
// ==========================================

interface DateRange {
  start: Date
  end: Date
}

/**
 * Get course overview stats
 */
export async function getCourseOverviewStats(courseId: string) {
  const [
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    totalViews,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { courseId } }),
    prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } }),
    prisma.enrollment.count({ where: { courseId, status: 'COMPLETED' } }),
    prisma.courseAnalyticsEvent.count({
      where: { courseId, eventType: 'COURSE_VIEWED' },
    }),
  ])

  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0

  return {
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate,
    totalViews,
  }
}

/**
 * Get enrollment trends over time
 */
export async function getEnrollmentTrends(
  courseId: string,
  dateRange?: DateRange,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const where: Record<string, unknown> = { courseId }

  if (dateRange) {
    where.enrolledAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    select: {
      enrolledAt: true,
    },
    orderBy: { enrolledAt: 'asc' },
  })

  // Group by date
  const grouped = new Map<string, number>()

  for (const enrollment of enrollments) {
    const date = enrollment.enrolledAt
    let key: string

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0]
    } else if (groupBy === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    grouped.set(key, (grouped.get(key) || 0) + 1)
  }

  return Array.from(grouped.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}

/**
 * Get completion trends over time
 */
export async function getCompletionTrends(
  courseId: string,
  dateRange?: DateRange,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const where: Record<string, unknown> = {
    courseId,
    completedAt: { not: null },
  }

  if (dateRange) {
    where.completedAt = {
      ...where.completedAt as object,
      gte: dateRange.start,
      lte: dateRange.end,
    }
  }

  const completions = await prisma.enrollment.findMany({
    where,
    select: {
      completedAt: true,
    },
    orderBy: { completedAt: 'asc' },
  })

  const grouped = new Map<string, number>()

  for (const enrollment of completions) {
    if (!enrollment.completedAt) continue
    const date = enrollment.completedAt
    let key: string

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0]
    } else if (groupBy === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    grouped.set(key, (grouped.get(key) || 0) + 1)
  }

  return Array.from(grouped.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}

/**
 * Get progress distribution (how many students at each progress level)
 */
export async function getProgressDistribution(courseId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { progressPercent: true },
  })

  // Create buckets: 0%, 1-25%, 26-50%, 51-75%, 76-99%, 100%
  const buckets = {
    'Not Started (0%)': 0,
    '1-25%': 0,
    '26-50%': 0,
    '51-75%': 0,
    '76-99%': 0,
    'Completed (100%)': 0,
  }

  for (const enrollment of enrollments) {
    const progress = enrollment.progressPercent
    if (progress === 0) {
      buckets['Not Started (0%)']++
    } else if (progress <= 25) {
      buckets['1-25%']++
    } else if (progress <= 50) {
      buckets['26-50%']++
    } else if (progress <= 75) {
      buckets['51-75%']++
    } else if (progress < 100) {
      buckets['76-99%']++
    } else {
      buckets['Completed (100%)']++
    }
  }

  return Object.entries(buckets).map(([label, count]) => ({
    label,
    count,
    percentage: enrollments.length > 0
      ? Math.round((count / enrollments.length) * 100)
      : 0,
  }))
}

/**
 * Get lesson/part engagement stats (drop-off analysis)
 */
export async function getContentEngagement(courseId: string) {
  // Get all parts for the course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              parts: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true },
              },
            },
          },
        },
      },
      lessons: {
        where: { moduleId: null },
        orderBy: { order: 'asc' },
        include: {
          parts: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true },
          },
        },
      },
    },
  })

  if (!course) return []

  // Build ordered list of parts
  const orderedParts: { id: string; title: string; lessonTitle: string; moduleTitle?: string }[] = []

  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        orderedParts.push({
          id: part.id,
          title: part.title,
          lessonTitle: lesson.title,
          moduleTitle: module.title,
        })
      }
    }
  }

  for (const lesson of course.lessons) {
    for (const part of lesson.parts) {
      orderedParts.push({
        id: part.id,
        title: part.title,
        lessonTitle: lesson.title,
      })
    }
  }

  // Get completion counts for each part
  const partCompletions = await prisma.partProgress.groupBy({
    by: ['partId'],
    where: {
      enrollment: { courseId },
      status: 'COMPLETED',
    },
    _count: true,
  })

  const completionMap = new Map(
    partCompletions.map((p) => [p.partId, p._count])
  )

  // Get total enrollments for percentage calculation
  const totalEnrollments = await prisma.enrollment.count({ where: { courseId } })

  return orderedParts.map((part, index) => ({
    order: index + 1,
    partId: part.id,
    title: part.title,
    lessonTitle: part.lessonTitle,
    moduleTitle: part.moduleTitle,
    completions: completionMap.get(part.id) || 0,
    completionRate: totalEnrollments > 0
      ? Math.round(((completionMap.get(part.id) || 0) / totalEnrollments) * 100)
      : 0,
  }))
}

/**
 * Get quiz performance stats
 */
export async function getQuizStats(courseId: string) {
  const quizzes = await prisma.lmsQuiz.findMany({
    where: { courseId },
    include: {
      attempts: {
        select: {
          score: true,
          passed: true,
          completedAt: true,
        },
      },
    },
  })

  return quizzes.map((quiz) => {
    const completedAttempts = quiz.attempts.filter((a) => a.completedAt)
    const passedAttempts = completedAttempts.filter((a) => a.passed)
    const scores = completedAttempts.map((a) => a.score).filter((s): s is number => s !== null)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    return {
      quizId: quiz.id,
      title: quiz.title,
      totalAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      passRate: completedAttempts.length > 0
        ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
        : 0,
      averageScore: avgScore,
      passingScore: quiz.passingScore,
    }
  })
}

/**
 * Get average time to completion
 */
export async function getAverageCompletionTime(courseId: string) {
  const completedEnrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      completedAt: { not: null },
    },
    select: {
      enrolledAt: true,
      completedAt: true,
    },
  })

  if (completedEnrollments.length === 0) {
    return { averageDays: 0, count: 0 }
  }

  let totalDays = 0
  for (const enrollment of completedEnrollments) {
    if (enrollment.completedAt) {
      const diff = enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime()
      totalDays += diff / (1000 * 60 * 60 * 24)
    }
  }

  return {
    averageDays: Math.round(totalDays / completedEnrollments.length),
    count: completedEnrollments.length,
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(
  courseId: string,
  limit: number = 20
) {
  const events = await prisma.courseAnalyticsEvent.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      course: {
        select: { title: true },
      },
    },
  })

  // Enrich with user info
  const userIds = events.map((e) => e.userId).filter(Boolean) as string[]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    eventData: event.eventData,
    createdAt: event.createdAt,
    user: event.userId ? userMap.get(event.userId) : null,
    anonymousId: event.anonymousId,
  }))
}

/**
 * Get top students by progress
 */
export async function getTopStudents(
  courseId: string,
  limit: number = 10
) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: [
      { progressPercent: 'desc' },
      { enrolledAt: 'asc' },
    ],
    take: limit,
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

  return enrollments.map((e) => ({
    enrollmentId: e.id,
    user: e.user,
    progressPercent: e.progressPercent,
    status: e.status,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
  }))
}

/**
 * Get aggregate stats for admin dashboard
 */
export async function getAdminDashboardStats(courseId: string) {
  const [
    overview,
    progressDistribution,
    avgCompletionTime,
    quizStats,
  ] = await Promise.all([
    getCourseOverviewStats(courseId),
    getProgressDistribution(courseId),
    getAverageCompletionTime(courseId),
    getQuizStats(courseId),
  ])

  // Calculate overall quiz pass rate
  const totalQuizAttempts = quizStats.reduce((sum, q) => sum + q.totalAttempts, 0)
  const totalQuizPasses = quizStats.reduce((sum, q) => sum + q.passedAttempts, 0)
  const overallQuizPassRate = totalQuizAttempts > 0
    ? Math.round((totalQuizPasses / totalQuizAttempts) * 100)
    : 0

  return {
    ...overview,
    progressDistribution,
    avgCompletionDays: avgCompletionTime.averageDays,
    completionsCount: avgCompletionTime.count,
    quizzes: {
      total: quizStats.length,
      overallPassRate: overallQuizPassRate,
      totalAttempts: totalQuizAttempts,
    },
  }
}
