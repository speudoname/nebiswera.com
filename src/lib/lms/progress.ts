/**
 * LMS Progress Calculation Utilities
 *
 * Functions for calculating and updating course progress
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { CourseSettings } from './types';
import { parseCourseSettings } from './types';
import {
  queueCourseStartNotifications,
  queueLessonCompleteNotifications,
  queueCourseCompleteNotifications,
  queueQuizNotifications,
  queueCertificateNotifications,
} from '@/app/api/courses/lib/notifications';
import { generateCertificate } from './certificates';
import { parseCourseSettings as parseSettings } from './types';
import {
  trackEvent,
  trackPartCompleted,
  trackCourseCompleted,
  trackQuizEvent,
} from '@/app/api/courses/lib/analytics';

/**
 * Calculate the overall progress percentage for an enrollment
 * Based on completed parts vs total parts
 */
export async function calculateEnrollmentProgress(enrollmentId: string): Promise<number> {
  // Get all parts for this enrollment's course
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  parts: true,
                },
              },
            },
          },
          lessons: {
            where: { moduleId: null }, // Direct lessons (no module)
            include: {
              parts: true,
            },
          },
        },
      },
      partProgress: true,
    },
  });

  if (!enrollment) {
    return 0;
  }

  // Collect all part IDs
  const allPartIds: string[] = [];

  // Parts from modules
  for (const module of enrollment.course.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        allPartIds.push(part.id);
      }
    }
  }

  // Parts from direct lessons
  for (const lesson of enrollment.course.lessons) {
    for (const part of lesson.parts) {
      allPartIds.push(part.id);
    }
  }

  if (allPartIds.length === 0) {
    return 0;
  }

  // Count completed parts
  const completedCount = enrollment.partProgress.filter(
    (p) => p.status === 'COMPLETED'
  ).length;

  return Math.round((completedCount / allPartIds.length) * 100);
}

/**
 * Update enrollment progress and check for completion
 * Also triggers course completion notifications if applicable
 */
export async function updateEnrollmentProgress(enrollmentId: string): Promise<{
  progressPercent: number;
  isCompleted: boolean;
  wasJustCompleted: boolean;
}> {
  // Get current state before updating
  const current = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { progressPercent: true, completedAt: true },
  });

  const wasAlreadyCompleted = current?.completedAt !== null;
  const previousProgress = current?.progressPercent || 0;

  const progressPercent = await calculateEnrollmentProgress(enrollmentId);
  const isCompleted = progressPercent === 100;
  const wasJustCompleted = isCompleted && !wasAlreadyCompleted;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent,
      completedAt: isCompleted ? new Date() : null,
      status: isCompleted ? 'COMPLETED' : 'ACTIVE',
    },
  });

  // Queue course completion notifications if just completed
  if (wasJustCompleted) {
    try {
      await queueCourseCompleteNotifications(enrollmentId);
    } catch (error) {
      logger.error('Failed to queue course completion notifications:', error);
    }

    // Generate certificate if enabled
    try {
      const enrollmentWithCourse = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: { select: { settings: true } } },
      });

      if (enrollmentWithCourse) {
        const courseSettings = parseSettings(enrollmentWithCourse.course.settings);
        if (courseSettings.certificateEnabled) {
          const certResult = await generateCertificate(enrollmentId);
          // Queue certificate notification
          await queueCertificateNotifications(enrollmentId, certResult.certificateUrl, certResult.certificateId);
        }
      }
    } catch (error) {
      logger.error('Failed to generate certificate:', error);
    }
  }

  return { progressPercent, isCompleted, wasJustCompleted };
}

/**
 * Check if a video should be marked as complete based on watch percentage
 */
export function shouldAutoCompleteVideo(
  watchPercent: number,
  settings: CourseSettings
): boolean {
  return watchPercent >= settings.videoCompletionThreshold;
}

/**
 * Update part progress for video/audio content
 */
export async function updatePartVideoProgress(
  enrollmentId: string,
  partId: string,
  watchTime: number,
  duration: number
): Promise<{
  watchPercent: number;
  isCompleted: boolean;
  progressPercent: number;
}> {
  // Get course settings
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const settings = parseCourseSettings(enrollment.course.settings);
  const watchPercent = duration > 0 ? Math.round((watchTime / duration) * 100) : 0;
  const shouldComplete = shouldAutoCompleteVideo(watchPercent, settings);

  // Update or create part progress
  await prisma.partProgress.upsert({
    where: {
      enrollmentId_partId: {
        enrollmentId,
        partId,
      },
    },
    create: {
      enrollmentId,
      partId,
      status: shouldComplete ? 'COMPLETED' : 'IN_PROGRESS',
      watchTime,
      duration,
      watchPercent,
      completedAt: shouldComplete ? new Date() : null,
      completedBy: shouldComplete ? 'AUTO_VIDEO' : null,
      lastAccessedAt: new Date(),
    },
    update: {
      status: shouldComplete ? 'COMPLETED' : 'IN_PROGRESS',
      watchTime,
      watchPercent,
      completedAt: shouldComplete ? new Date() : undefined,
      completedBy: shouldComplete ? 'AUTO_VIDEO' : undefined,
      lastAccessedAt: new Date(),
    },
  });

  // Update overall enrollment progress
  const { progressPercent, isCompleted } = await updateEnrollmentProgress(enrollmentId);

  return {
    watchPercent,
    isCompleted: shouldComplete,
    progressPercent,
  };
}

/**
 * Manually mark a part as complete
 */
export async function markPartComplete(
  enrollmentId: string,
  partId: string,
  completedBy: 'MANUAL' | 'ADMIN' = 'MANUAL'
): Promise<{
  progressPercent: number;
  isCompleted: boolean;
}> {
  // Update part progress
  await prisma.partProgress.upsert({
    where: {
      enrollmentId_partId: {
        enrollmentId,
        partId,
      },
    },
    create: {
      enrollmentId,
      partId,
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy,
      lastAccessedAt: new Date(),
    },
    update: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy,
      lastAccessedAt: new Date(),
    },
  });

  // Update overall enrollment progress
  return updateEnrollmentProgress(enrollmentId);
}

/**
 * Mark a part as complete after passing a quiz
 */
export async function markPartCompleteByQuiz(
  enrollmentId: string,
  partId: string
): Promise<{
  progressPercent: number;
  isCompleted: boolean;
}> {
  // Update part progress
  await prisma.partProgress.upsert({
    where: {
      enrollmentId_partId: {
        enrollmentId,
        partId,
      },
    },
    create: {
      enrollmentId,
      partId,
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy: 'AUTO_QUIZ',
      lastAccessedAt: new Date(),
    },
    update: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy: 'AUTO_QUIZ',
      lastAccessedAt: new Date(),
    },
  });

  // Update overall enrollment progress
  return updateEnrollmentProgress(enrollmentId);
}

/**
 * Get the next uncompleted part for resume functionality
 */
export async function getNextUncompletedPart(
  enrollmentId: string
): Promise<string | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                include: {
                  parts: {
                    orderBy: { order: 'asc' },
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
              },
            },
          },
        },
      },
      partProgress: true,
    },
  });

  if (!enrollment) {
    return null;
  }

  const completedPartIds = new Set(
    enrollment.partProgress
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => p.partId)
  );

  // Check parts in order: modules first, then direct lessons
  for (const module of enrollment.course.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        if (!completedPartIds.has(part.id)) {
          return part.id;
        }
      }
    }
  }

  for (const lesson of enrollment.course.lessons) {
    for (const part of lesson.parts) {
      if (!completedPartIds.has(part.id)) {
        return part.id;
      }
    }
  }

  // All parts completed
  return null;
}

/**
 * Check if content is available based on drip settings
 */
export function isContentAvailable(
  enrolledAt: Date,
  availableAfterDays: number | null,
  dripEnabled: boolean
): boolean {
  if (!dripEnabled || availableAfterDays === null) {
    return true;
  }

  const now = new Date();
  const availableDate = new Date(enrolledAt);
  availableDate.setDate(availableDate.getDate() + availableAfterDays);

  return now >= availableDate;
}

/**
 * Check if content is locked due to sequential lock
 */
export async function isContentLocked(
  enrollmentId: string,
  partId: string,
  sequentialLock: boolean
): Promise<boolean> {
  if (!sequentialLock) {
    return false;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                include: {
                  parts: {
                    orderBy: { order: 'asc' },
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
              },
            },
          },
        },
      },
      partProgress: true,
    },
  });

  if (!enrollment) {
    return true;
  }

  const completedPartIds = new Set(
    enrollment.partProgress
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => p.partId)
  );

  // Build ordered list of all parts
  const orderedParts: string[] = [];

  for (const module of enrollment.course.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        orderedParts.push(part.id);
      }
    }
  }

  for (const lesson of enrollment.course.lessons) {
    for (const part of lesson.parts) {
      orderedParts.push(part.id);
    }
  }

  // Find the index of the requested part
  const partIndex = orderedParts.indexOf(partId);
  if (partIndex === -1) {
    return true; // Part not found
  }

  // First part is never locked
  if (partIndex === 0) {
    return false;
  }

  // Check if previous part is completed
  const previousPartId = orderedParts[partIndex - 1];
  return !completedPartIds.has(previousPartId);
}

/**
 * Mark a part as complete and trigger appropriate notifications
 * This is the main function to use for recording progress with notifications
 */
export async function completePartWithNotifications(
  enrollmentId: string,
  partId: string,
  options?: {
    lessonId?: string;
    lessonTitle?: string;
    completedBy?: 'MANUAL' | 'AUTO_VIDEO' | 'AUTO_QUIZ' | 'ADMIN';
  }
): Promise<{
  progressPercent: number;
  isCompleted: boolean;
  isFirstPart: boolean;
  wasJustCompleted: boolean;
}> {
  // Check if this is the first part being completed (course start)
  const existingProgress = await prisma.partProgress.count({
    where: {
      enrollmentId,
      status: 'COMPLETED',
    },
  });
  const isFirstPart = existingProgress === 0;

  // Mark the part complete
  const completedBy = options?.completedBy || 'MANUAL';
  await prisma.partProgress.upsert({
    where: {
      enrollmentId_partId: {
        enrollmentId,
        partId,
      },
    },
    create: {
      enrollmentId,
      partId,
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy,
      lastAccessedAt: new Date(),
    },
    update: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy,
      lastAccessedAt: new Date(),
    },
  });

  // Update overall enrollment progress (this handles course completion notifications)
  const { progressPercent, isCompleted, wasJustCompleted } = await updateEnrollmentProgress(enrollmentId);

  // Queue course start notification if this is the first part
  if (isFirstPart) {
    try {
      await queueCourseStartNotifications(enrollmentId);
    } catch (error) {
      logger.error('Failed to queue course start notifications:', error);
    }
  }

  // Queue lesson complete notification if lesson info provided and not yet completed course
  if (options?.lessonId && options?.lessonTitle && !wasJustCompleted) {
    try {
      await queueLessonCompleteNotifications(enrollmentId, options.lessonId, options.lessonTitle);
    } catch (error) {
      logger.error('Failed to queue lesson completion notifications:', error);
    }
  }

  // Track analytics events
  try {
    // Get enrollment details for analytics
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { select: { id: true } },
      },
    });

    if (enrollment) {
      // Track part completion
      await trackPartCompleted(
        enrollment.courseId,
        partId,
        options?.lessonId || '',
        undefined,
        enrollment.userId,
        enrollmentId
      );

      // Track course start if first part
      if (isFirstPart) {
        await trackEvent({
          courseId: enrollment.courseId,
          eventType: 'COURSE_VIEWED',
          userId: enrollment.userId,
          enrollmentId,
        });
      }

      // Track course completion if just completed
      if (wasJustCompleted) {
        await trackCourseCompleted(
          enrollment.courseId,
          enrollment.userId,
          enrollmentId
        );
      }
    }
  } catch (error) {
    logger.error('Failed to track part completion analytics:', error);
  }

  return { progressPercent, isCompleted, isFirstPart, wasJustCompleted };
}

/**
 * Mark a part as incomplete (uncomplete)
 * Reverts a completed part back to not started status
 */
export async function uncompletePart(
  enrollmentId: string,
  partId: string
): Promise<{
  progressPercent: number;
  isCompleted: boolean;
}> {
  // Update part progress to NOT_STARTED
  await prisma.partProgress.update({
    where: {
      enrollmentId_partId: {
        enrollmentId,
        partId,
      },
    },
    data: {
      status: 'NOT_STARTED',
      completedAt: null,
      completedBy: null,
      lastAccessedAt: new Date(),
    },
  });

  // Recalculate enrollment progress
  const progressPercent = await calculateEnrollmentProgress(enrollmentId);
  const isCompleted = progressPercent === 100;

  // Update enrollment - if we uncompleted, course is no longer complete
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent,
      // Only update completedAt if the course is now not complete
      completedAt: isCompleted ? undefined : null,
      status: isCompleted ? 'COMPLETED' : 'ACTIVE',
    },
  });

  return { progressPercent, isCompleted };
}

/**
 * Record quiz result and trigger appropriate notifications
 */
export async function recordQuizResultWithNotifications(
  enrollmentId: string,
  quizId: string,
  quizTitle: string,
  score: number,
  passingScore: number,
  passed: boolean,
  attemptsRemaining?: number
): Promise<void> {
  try {
    await queueQuizNotifications(
      enrollmentId,
      quizId,
      quizTitle,
      score,
      passingScore,
      passed,
      attemptsRemaining
    );
  } catch (error) {
    logger.error('Failed to queue quiz notifications:', error);
  }

  // Track quiz analytics
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { courseId: true, userId: true },
    });

    if (enrollment) {
      await trackQuizEvent(
        enrollment.courseId,
        quizId,
        passed ? 'QUIZ_PASSED' : 'QUIZ_FAILED',
        enrollment.userId,
        enrollmentId,
        { score, passingScore, attemptsRemaining }
      );
    }
  } catch (error) {
    logger.error('Failed to track quiz analytics:', error);
  }
}
