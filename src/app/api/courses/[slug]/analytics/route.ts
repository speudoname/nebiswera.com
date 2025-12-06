import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import { auth } from '@/lib/auth/config'
import { getAnonymousId } from '@/lib/lms/local-storage'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/courses/[slug]/analytics - Track video/content analytics
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { slug } = await params

  try {
    const body = await request.json()
    const {
      eventType,
      eventData,
      partId,
      lessonId,
      moduleId,
      quizId,
    } = body

    // Find the course
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Get enrollment if user is logged in
    let enrollmentId: string | undefined
    if (session?.user?.id) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: course.id,
            userId: session.user.id,
          },
        },
        select: { id: true },
      })
      enrollmentId = enrollment?.id
    }

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || undefined
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined

    // Generate anonymous ID for non-logged-in users
    const anonymousId = session?.user?.id ? null : (eventData?.sessionId || `anon_${Date.now()}`)

    // Create analytics event
    await prisma.courseAnalyticsEvent.create({
      data: {
        courseId: course.id,
        userId: session?.user?.id || null,
        anonymousId,
        enrollmentId,
        eventType: eventType as 'VIDEO_STARTED' | 'VIDEO_PROGRESS' | 'VIDEO_COMPLETED',
        eventData: eventData || {},
        partId,
        lessonId,
        moduleId,
        quizId,
        userAgent,
        ipAddress,
      },
    })

    return successResponse({ tracked: true })
  } catch (error) {
    logger.error('Failed to track course analytics:', error)
    return errorResponse('Failed to track analytics')
  }
}
