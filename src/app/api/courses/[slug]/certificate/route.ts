import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  errorResponse,
  logger,
} from '@/lib'
import { generateCertificate, hasCertificate } from '@/lib/lms/certificates'
import { queueCertificateNotifications } from '@/app/api/courses/lib/notifications'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/courses/[slug]/certificate - Get certificate for current user
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { slug } = await params

  if (!session?.user?.id) {
    return unauthorizedResponse('You must be logged in')
  }

  try {
    // Find course
    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        settings: true,
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Check certificate is enabled
    const settings = course.settings as Record<string, unknown> | null
    if (settings?.certificateEnabled === false) {
      return badRequestResponse('Certificates are not enabled for this course')
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        completedAt: true,
        certificateId: true,
        certificateUrl: true,
        certificateIssuedAt: true,
      },
    })

    if (!enrollment) {
      return notFoundResponse('You are not enrolled in this course')
    }

    if (!enrollment.completedAt) {
      return badRequestResponse('You must complete the course to receive a certificate')
    }

    // If certificate already exists, return it
    if (enrollment.certificateId && enrollment.certificateUrl) {
      return successResponse({
        certificate: {
          id: enrollment.certificateId,
          url: enrollment.certificateUrl,
          issuedAt: enrollment.certificateIssuedAt,
        },
      })
    }

    // No certificate yet - return info about eligibility
    return successResponse({
      eligible: true,
      message: 'You are eligible for a certificate. Generate it now!',
    })
  } catch (error) {
    logger.error('Failed to get certificate:', error)
    return errorResponse('Failed to get certificate')
  }
}

// POST /api/courses/[slug]/certificate - Generate certificate
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { slug } = await params

  if (!session?.user?.id) {
    return unauthorizedResponse('You must be logged in')
  }

  try {
    // Find course
    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        settings: true,
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    // Check certificate is enabled
    const settings = course.settings as Record<string, unknown> | null
    if (settings?.certificateEnabled === false) {
      return badRequestResponse('Certificates are not enabled for this course')
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        completedAt: true,
        certificateId: true,
        certificateUrl: true,
      },
    })

    if (!enrollment) {
      return notFoundResponse('You are not enrolled in this course')
    }

    if (!enrollment.completedAt) {
      return badRequestResponse('You must complete the course to receive a certificate')
    }

    // Check if already has certificate
    if (enrollment.certificateId && enrollment.certificateUrl) {
      return successResponse({
        certificate: {
          id: enrollment.certificateId,
          url: enrollment.certificateUrl,
        },
        message: 'Certificate already exists',
      })
    }

    // Generate certificate
    const result = await generateCertificate(enrollment.id)

    // Queue notification
    try {
      await queueCertificateNotifications(enrollment.id, result.certificateUrl, result.certificateId)
    } catch (e) {
      logger.error('Failed to queue certificate notification:', e)
    }

    return successResponse({
      certificate: {
        id: result.certificateId,
        url: result.certificateUrl,
      },
      message: 'Certificate generated successfully',
    })
  } catch (error) {
    logger.error('Failed to generate certificate:', error)
    return errorResponse('Failed to generate certificate')
  }
}
