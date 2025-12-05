import type { CourseEmailTemplate, CourseTemplateVariables } from './types'
import type { CourseNotificationTrigger } from '@prisma/client'

// Import all template functions
import { getEnrollmentWelcomeEN } from './enrollment-welcome-en'
import { getEnrollmentWelcomeKA } from './enrollment-welcome-ka'
import { getEnrollmentNudgeEN } from './enrollment-nudge-en'
import { getEnrollmentNudgeKA } from './enrollment-nudge-ka'
import { getCourseStartedEN } from './course-started-en'
import { getCourseStartedKA } from './course-started-ka'
import { getHalfwayMilestoneEN } from './halfway-milestone-en'
import { getHalfwayMilestoneKA } from './halfway-milestone-ka'
import { getCourseCompletedEN } from './course-completed-en'
import { getCourseCompletedKA } from './course-completed-ka'
import { getQuizPassedEN } from './quiz-passed-en'
import { getQuizPassedKA } from './quiz-passed-ka'
import { getQuizFailedEN } from './quiz-failed-en'
import { getQuizFailedKA } from './quiz-failed-ka'
import { getInactivity7dEN } from './inactivity-7d-en'
import { getInactivity7dKA } from './inactivity-7d-ka'
import { getInactivity14dEN } from './inactivity-14d-en'
import { getInactivity14dKA } from './inactivity-14d-ka'
import { getExpiration7dEN } from './expiration-7d-en'
import { getExpiration7dKA } from './expiration-7d-ka'
import { getExpiration1dEN } from './expiration-1d-en'
import { getExpiration1dKA } from './expiration-1d-ka'
import { getCertificateIssuedEN } from './certificate-issued-en'
import { getCertificateIssuedKA } from './certificate-issued-ka'

export type { CourseEmailTemplate, CourseTemplateVariables }

// Template key type
export type CourseTemplateKey =
  | 'enrollment-welcome'
  | 'enrollment-nudge'
  | 'course-started'
  | 'halfway-milestone'
  | 'course-completed'
  | 'quiz-passed'
  | 'quiz-failed'
  | 'inactivity-7d'
  | 'inactivity-14d'
  | 'expiration-7d'
  | 'expiration-1d'
  | 'certificate-issued'

// Template registry by locale
const templateRegistry: Record<
  CourseTemplateKey,
  Record<'en' | 'ka', (vars: CourseTemplateVariables) => CourseEmailTemplate>
> = {
  'enrollment-welcome': {
    en: getEnrollmentWelcomeEN,
    ka: getEnrollmentWelcomeKA,
  },
  'enrollment-nudge': {
    en: getEnrollmentNudgeEN,
    ka: getEnrollmentNudgeKA,
  },
  'course-started': {
    en: getCourseStartedEN,
    ka: getCourseStartedKA,
  },
  'halfway-milestone': {
    en: getHalfwayMilestoneEN,
    ka: getHalfwayMilestoneKA,
  },
  'course-completed': {
    en: getCourseCompletedEN,
    ka: getCourseCompletedKA,
  },
  'quiz-passed': {
    en: getQuizPassedEN,
    ka: getQuizPassedKA,
  },
  'quiz-failed': {
    en: getQuizFailedEN,
    ka: getQuizFailedKA,
  },
  'inactivity-7d': {
    en: getInactivity7dEN,
    ka: getInactivity7dKA,
  },
  'inactivity-14d': {
    en: getInactivity14dEN,
    ka: getInactivity14dKA,
  },
  'expiration-7d': {
    en: getExpiration7dEN,
    ka: getExpiration7dKA,
  },
  'expiration-1d': {
    en: getExpiration1dEN,
    ka: getExpiration1dKA,
  },
  'certificate-issued': {
    en: getCertificateIssuedEN,
    ka: getCertificateIssuedKA,
  },
}

/**
 * Get a course email template by key and locale
 */
export function getCourseTemplate(
  key: CourseTemplateKey,
  locale: 'en' | 'ka',
  vars: CourseTemplateVariables
): CourseEmailTemplate {
  const templates = templateRegistry[key]
  if (!templates) {
    throw new Error(`Unknown template key: ${key}`)
  }
  const templateFn = templates[locale] || templates['en']
  return templateFn(vars)
}

/**
 * Check if a template key exists
 */
export function isValidTemplateKey(key: string): key is CourseTemplateKey {
  return key in templateRegistry
}

/**
 * Get all available template keys
 */
export function getAvailableTemplateKeys(): CourseTemplateKey[] {
  return Object.keys(templateRegistry) as CourseTemplateKey[]
}

// Template metadata for admin UI
export interface TemplateMetadata {
  key: CourseTemplateKey
  name: string
  description: string
  trigger: CourseNotificationTrigger
  triggerMinutes: number
  variables: string[]
}

export const templateMetadata: TemplateMetadata[] = [
  {
    key: 'enrollment-welcome',
    name: 'Enrollment Welcome',
    description: 'Sent immediately after a student enrolls in a course',
    trigger: 'AFTER_ENROLLMENT',
    triggerMinutes: 0,
    variables: ['firstName', 'courseTitle', 'courseUrl', 'totalLessons', 'expiresDate'],
  },
  {
    key: 'enrollment-nudge',
    name: 'Enrollment Nudge',
    description: 'Sent if student enrolled but never started the course',
    trigger: 'AFTER_ENROLLMENT',
    triggerMinutes: 2880, // 48 hours
    variables: ['firstName', 'courseTitle', 'courseUrl'],
  },
  {
    key: 'course-started',
    name: 'Course Started',
    description: 'Sent when student starts their first lesson',
    trigger: 'ON_COURSE_START',
    triggerMinutes: 0,
    variables: ['firstName', 'courseTitle', 'continueUrl', 'progressPercent', 'lessonsCompleted', 'totalLessons'],
  },
  {
    key: 'halfway-milestone',
    name: 'Halfway Milestone',
    description: 'Congratulation when student reaches 50% progress',
    trigger: 'ON_LESSON_COMPLETE',
    triggerMinutes: 0,
    variables: ['firstName', 'courseTitle', 'continueUrl', 'progressPercent', 'lessonsCompleted', 'totalLessons'],
  },
  {
    key: 'course-completed',
    name: 'Course Completed',
    description: 'Sent when student completes all lessons',
    trigger: 'ON_COURSE_COMPLETE',
    triggerMinutes: 0,
    variables: ['firstName', 'courseTitle', 'totalLessons', 'timeSpent', 'certificateUrl'],
  },
  {
    key: 'quiz-passed',
    name: 'Quiz Passed',
    description: 'Sent when student passes a quiz',
    trigger: 'ON_QUIZ_PASS',
    triggerMinutes: 0,
    variables: ['firstName', 'courseTitle', 'quizTitle', 'quizScore', 'passingScore', 'continueUrl'],
  },
  {
    key: 'quiz-failed',
    name: 'Quiz Failed',
    description: 'Sent when student fails a quiz with encouragement to retry',
    trigger: 'ON_QUIZ_FAIL',
    triggerMinutes: 0,
    variables: ['firstName', 'courseTitle', 'quizTitle', 'quizScore', 'passingScore', 'attemptsRemaining', 'courseUrl'],
  },
  {
    key: 'inactivity-7d',
    name: 'Inactivity Reminder (7 days)',
    description: 'Sent after 7 days of no activity',
    trigger: 'ON_INACTIVITY',
    triggerMinutes: 10080, // 7 days
    variables: ['firstName', 'courseTitle', 'continueUrl', 'progressPercent', 'lessonsCompleted', 'totalLessons', 'currentLesson'],
  },
  {
    key: 'inactivity-14d',
    name: 'Inactivity Reminder (14 days)',
    description: 'Sent after 14 days of no activity',
    trigger: 'ON_INACTIVITY',
    triggerMinutes: 20160, // 14 days
    variables: ['firstName', 'courseTitle', 'continueUrl', 'progressPercent', 'lessonsCompleted', 'totalLessons', 'currentLesson'],
  },
  {
    key: 'expiration-7d',
    name: 'Expiration Warning (7 days)',
    description: 'Sent 7 days before course access expires',
    trigger: 'BEFORE_EXPIRATION',
    triggerMinutes: 10080, // 7 days before
    variables: ['firstName', 'courseTitle', 'expiresDate', 'continueUrl', 'progressPercent', 'lessonsCompleted', 'totalLessons'],
  },
  {
    key: 'expiration-1d',
    name: 'Expiration Warning (1 day)',
    description: 'Sent 1 day before course access expires',
    trigger: 'BEFORE_EXPIRATION',
    triggerMinutes: 1440, // 1 day before
    variables: ['firstName', 'courseTitle', 'expiresDate', 'continueUrl', 'progressPercent', 'lessonsCompleted', 'totalLessons'],
  },
  {
    key: 'certificate-issued',
    name: 'Certificate Issued',
    description: 'Sent when certificate is generated',
    trigger: 'ON_CERTIFICATE_ISSUED',
    triggerMinutes: 0,
    variables: ['firstName', 'fullName', 'courseTitle', 'certificateUrl', 'certificateId'],
  },
]

/**
 * Get metadata for a specific template
 */
export function getTemplateMetadata(key: CourseTemplateKey): TemplateMetadata | undefined {
  return templateMetadata.find((t) => t.key === key)
}

/**
 * Get all templates for a specific trigger
 */
export function getTemplatesForTrigger(trigger: CourseNotificationTrigger): TemplateMetadata[] {
  return templateMetadata.filter((t) => t.trigger === trigger)
}

// Default notification configurations that can be loaded for a new course
export interface DefaultNotificationConfig {
  key: CourseTemplateKey
  trigger: CourseNotificationTrigger
  triggerMinutes: number
  isActive: boolean
  conditions?: Record<string, unknown>
}

export const defaultNotificationConfigs: DefaultNotificationConfig[] = [
  // Enrollment emails
  {
    key: 'enrollment-welcome',
    trigger: 'AFTER_ENROLLMENT',
    triggerMinutes: 0,
    isActive: true,
  },
  {
    key: 'enrollment-nudge',
    trigger: 'AFTER_ENROLLMENT',
    triggerMinutes: 2880, // 48 hours
    isActive: true,
    conditions: { hasNotStarted: true },
  },
  // Progress emails
  {
    key: 'course-started',
    trigger: 'ON_COURSE_START',
    triggerMinutes: 0,
    isActive: true,
  },
  {
    key: 'halfway-milestone',
    trigger: 'ON_LESSON_COMPLETE',
    triggerMinutes: 0,
    isActive: true,
    conditions: { progressPercent: { gte: 50, lt: 51 } },
  },
  {
    key: 'course-completed',
    trigger: 'ON_COURSE_COMPLETE',
    triggerMinutes: 0,
    isActive: true,
  },
  // Quiz emails
  {
    key: 'quiz-passed',
    trigger: 'ON_QUIZ_PASS',
    triggerMinutes: 0,
    isActive: true,
  },
  {
    key: 'quiz-failed',
    trigger: 'ON_QUIZ_FAIL',
    triggerMinutes: 0,
    isActive: true,
  },
  // Inactivity emails
  {
    key: 'inactivity-7d',
    trigger: 'ON_INACTIVITY',
    triggerMinutes: 10080,
    isActive: true,
    conditions: { hasNotCompleted: true },
  },
  {
    key: 'inactivity-14d',
    trigger: 'ON_INACTIVITY',
    triggerMinutes: 20160,
    isActive: true,
    conditions: { hasNotCompleted: true },
  },
  // Expiration emails
  {
    key: 'expiration-7d',
    trigger: 'BEFORE_EXPIRATION',
    triggerMinutes: 10080,
    isActive: true,
    conditions: { hasExpiration: true, hasNotCompleted: true },
  },
  {
    key: 'expiration-1d',
    trigger: 'BEFORE_EXPIRATION',
    triggerMinutes: 1440,
    isActive: true,
    conditions: { hasExpiration: true, hasNotCompleted: true },
  },
  // Certificate email
  {
    key: 'certificate-issued',
    trigger: 'ON_CERTIFICATE_ISSUED',
    triggerMinutes: 0,
    isActive: true,
  },
]
