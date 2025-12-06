import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { successResponse, unauthorizedResponse, badRequestResponse, errorResponse, logger } from '@/lib'
import { LmsProgressStatus } from '@prisma/client'

interface LocalStoragePartProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  watchTime?: number
  watchPercent?: number
  completedAt?: string
}

interface LocalStorageCourseProgress {
  enrolledAt: string
  lastAccessedAt: string
  lastPartId?: string
  parts: Record<string, LocalStoragePartProgress>
  quizAttempts: Record<
    string,
    Array<{
      quizId: string
      score: number
      passed: boolean
      attemptedAt: string
      answers?: Record<string, string[]>
    }>
  >
}

interface MigrationRequest {
  anonymousId: string
  courses: Record<string, LocalStorageCourseProgress>
}

// Map localStorage status to Prisma enum
function mapStatus(status: LocalStoragePartProgress['status']): LmsProgressStatus {
  switch (status) {
    case 'completed':
      return 'COMPLETED'
    case 'in_progress':
      return 'IN_PROGRESS'
    default:
      return 'NOT_STARTED'
  }
}

// POST /api/courses/migrate-progress - Migrate localStorage progress to server
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorizedResponse('You must be logged in to migrate progress')
  }

  try {
    const body = (await request.json()) as MigrationRequest
    const { anonymousId, courses } = body

    if (!anonymousId || !courses) {
      return badRequestResponse('Anonymous ID and courses data are required')
    }

    const migratedCourses: string[] = []
    const errors: string[] = []

    for (const [courseId, localProgress] of Object.entries(courses)) {
      try {
        // Find the course
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { id: true, accessType: true },
        })

        if (!course) {
          errors.push(`Course ${courseId} not found`)
          continue
        }

        // Check if user already has enrollment
        let enrollment = await prisma.enrollment.findUnique({
          where: {
            courseId_userId: {
              courseId: course.id,
              userId: session.user.id,
            },
          },
        })

        // Create enrollment if doesn't exist (for open courses)
        if (!enrollment) {
          enrollment = await prisma.enrollment.create({
            data: {
              courseId: course.id,
              userId: session.user.id,
              status: 'ACTIVE',
              enrolledAt: new Date(localProgress.enrolledAt),
            },
          })
        }

        // Migrate part progress
        for (const [partId, partProgress] of Object.entries(localProgress.parts)) {
          // Check if progress already exists
          const existingProgress = await prisma.partProgress.findFirst({
            where: {
              enrollmentId: enrollment.id,
              partId,
            },
          })

          const dbStatus = mapStatus(partProgress.status)

          if (existingProgress) {
            // Only update if local progress is more advanced
            if (
              partProgress.status === 'completed' &&
              existingProgress.status !== 'COMPLETED'
            ) {
              await prisma.partProgress.update({
                where: { id: existingProgress.id },
                data: {
                  status: 'COMPLETED',
                  watchTime: partProgress.watchTime || existingProgress.watchTime,
                  watchPercent: partProgress.watchPercent || existingProgress.watchPercent,
                  completedAt: partProgress.completedAt
                    ? new Date(partProgress.completedAt)
                    : new Date(),
                },
              })
            } else if (
              partProgress.status === 'in_progress' &&
              existingProgress.status === 'NOT_STARTED'
            ) {
              await prisma.partProgress.update({
                where: { id: existingProgress.id },
                data: {
                  status: 'IN_PROGRESS',
                  watchTime: Math.max(
                    partProgress.watchTime || 0,
                    existingProgress.watchTime || 0
                  ),
                  watchPercent: Math.max(
                    partProgress.watchPercent || 0,
                    existingProgress.watchPercent || 0
                  ),
                },
              })
            }
          } else {
            // Create new progress record
            await prisma.partProgress.create({
              data: {
                enrollmentId: enrollment.id,
                partId,
                status: dbStatus,
                watchTime: partProgress.watchTime || 0,
                watchPercent: partProgress.watchPercent || 0,
                completedAt: partProgress.completedAt
                  ? new Date(partProgress.completedAt)
                  : null,
              },
            })
          }
        }

        // Migrate quiz attempts
        for (const [quizId, attempts] of Object.entries(localProgress.quizAttempts)) {
          for (const attempt of attempts) {
            // Check if we already have this attempt (by timestamp)
            const existingAttempt = await prisma.lmsQuizAttempt.findFirst({
              where: {
                quizId,
                userId: session.user.id,
                startedAt: new Date(attempt.attemptedAt),
              },
            })

            if (!existingAttempt) {
              // Create the attempt
              await prisma.lmsQuizAttempt.create({
                data: {
                  quizId,
                  userId: session.user.id,
                  score: attempt.score,
                  passed: attempt.passed,
                  startedAt: new Date(attempt.attemptedAt),
                  completedAt: new Date(attempt.attemptedAt),
                },
              })
            }
          }
        }

        // Update enrollment progress
        await updateEnrollmentProgress(enrollment.id)

        migratedCourses.push(courseId)
      } catch (e) {
        logger.error(`Failed to migrate course ${courseId}:`, e)
        errors.push(`Failed to migrate course ${courseId}`)
      }
    }

    return successResponse({
      migrated: migratedCourses,
      errors: errors.length > 0 ? errors : undefined,
      message:
        migratedCourses.length > 0
          ? `Successfully migrated progress for ${migratedCourses.length} course(s)`
          : 'No courses migrated',
    })
  } catch (error) {
    logger.error('Failed to migrate progress:', error)
    return errorResponse('Failed to migrate progress')
  }
}

// Helper to update enrollment progress percentage
async function updateEnrollmentProgress(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  parts: {
                    select: { id: true },
                  },
                },
              },
            },
          },
          lessons: {
            include: {
              parts: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })

  if (!enrollment) return

  // Count total parts (from both module lessons and direct course lessons)
  let totalParts = 0

  // Count parts from modules -> lessons -> parts
  for (const module of enrollment.course.modules) {
    for (const lesson of module.lessons) {
      totalParts += lesson.parts.length
    }
  }

  // Count parts from direct lessons -> parts
  for (const lesson of enrollment.course.lessons) {
    totalParts += lesson.parts.length
  }

  if (totalParts === 0) return

  // Count completed parts
  const completedParts = await prisma.partProgress.count({
    where: {
      enrollmentId,
      status: 'COMPLETED',
    },
  })

  // Update enrollment
  const progressPercent = Math.round((completedParts / totalParts) * 100)

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent,
      completedAt: progressPercent >= 100 ? new Date() : null,
    },
  })
}
