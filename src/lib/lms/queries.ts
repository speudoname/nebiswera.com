/**
 * LMS Prisma Query Builders
 *
 * Centralized query patterns to eliminate duplicate include patterns
 * and ensure consistent data fetching across the LMS.
 */

import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// ===========================================
// REUSABLE PRISMA INCLUDES
// ===========================================

/**
 * Full course structure include - modules -> lessons -> parts
 */
export const courseStructureInclude = {
  modules: {
    orderBy: { order: 'asc' as const },
    include: {
      lessons: {
        orderBy: { order: 'asc' as const },
        include: {
          parts: {
            orderBy: { order: 'asc' as const },
          },
        },
      },
    },
  },
  lessons: {
    where: { moduleId: null }, // Direct lessons (no module)
    orderBy: { order: 'asc' as const },
    include: {
      parts: {
        orderBy: { order: 'asc' as const },
      },
    },
  },
} satisfies Prisma.CourseInclude

/**
 * Course with enrollment include pattern
 */
export const courseWithEnrollmentInclude = (userId: string) =>
  ({
    ...courseStructureInclude,
    enrollments: {
      where: { userId },
      include: {
        partProgress: true,
      },
    },
  }) satisfies Prisma.CourseInclude

/**
 * Enrollment with progress include pattern
 */
export const enrollmentWithProgressInclude = {
  partProgress: true,
  course: {
    include: courseStructureInclude,
  },
} satisfies Prisma.EnrollmentInclude

/**
 * Enrollment with course and user for notifications
 */
export const enrollmentForNotificationsInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      settings: true,
    },
  },
} satisfies Prisma.EnrollmentInclude

// ===========================================
// QUERY FUNCTIONS
// ===========================================

/**
 * Get course by slug with full structure
 */
export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: courseStructureInclude,
  })
}

/**
 * Get course by ID with full structure
 */
export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: courseStructureInclude,
  })
}

/**
 * Get course with user's enrollment
 */
export async function getCourseWithEnrollment(slug: string, userId: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: courseWithEnrollmentInclude(userId),
  })
}

/**
 * Get enrollment by ID with progress and course
 */
export async function getEnrollmentWithProgress(enrollmentId: string) {
  return prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: enrollmentWithProgressInclude,
  })
}

/**
 * Get user's enrollment for a course
 */
export async function getUserEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
    include: {
      partProgress: true,
    },
  })
}

/**
 * Get enrollment for notifications (includes user and course data)
 */
export async function getEnrollmentForNotifications(enrollmentId: string) {
  return prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: enrollmentForNotificationsInclude,
  })
}

/**
 * Get all enrollments for a user with progress
 */
export async function getUserEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          description: true,
        },
      },
      partProgress: {
        where: { status: 'COMPLETED' },
        select: { id: true },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })
}

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CourseWithStructure = NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>
export type CourseWithEnrollment = NonNullable<Awaited<ReturnType<typeof getCourseWithEnrollment>>>
export type EnrollmentWithProgress = NonNullable<Awaited<ReturnType<typeof getEnrollmentWithProgress>>>
export type EnrollmentForNotifications = NonNullable<Awaited<ReturnType<typeof getEnrollmentForNotifications>>>
