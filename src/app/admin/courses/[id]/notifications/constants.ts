import {
  Bell,
  CheckCircle,
  Play,
  BookOpen,
  Target,
  Trophy,
  HelpCircle,
  Clock,
  AlertTriangle,
  Award,
} from 'lucide-react'
import type { TriggerType, TriggerConfig, TemplateInfo, TemplateVariable } from './types'

export const TRIGGER_CONFIGS: Record<TriggerType, TriggerConfig> = {
  AFTER_ENROLLMENT: {
    label: 'After Enrollment',
    description: 'When a student enrolls in the course',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    category: 'enrollment',
  },
  ON_COURSE_START: {
    label: 'Course Started',
    description: 'When student starts their first lesson',
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    category: 'progress',
  },
  ON_LESSON_COMPLETE: {
    label: 'Lesson Complete',
    description: 'When a lesson is completed (use conditions for milestones)',
    icon: BookOpen,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
    category: 'progress',
  },
  ON_MODULE_COMPLETE: {
    label: 'Module Complete',
    description: 'When a module is completed',
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    category: 'progress',
  },
  ON_COURSE_COMPLETE: {
    label: 'Course Complete',
    description: 'When all lessons are completed',
    icon: Trophy,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
    category: 'completion',
  },
  ON_QUIZ_PASS: {
    label: 'Quiz Passed',
    description: 'When student passes a quiz',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100',
    category: 'quiz',
  },
  ON_QUIZ_FAIL: {
    label: 'Quiz Failed',
    description: 'When student fails a quiz',
    icon: HelpCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    category: 'quiz',
  },
  ON_INACTIVITY: {
    label: 'Inactivity',
    description: 'After period of no activity',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    category: 'engagement',
  },
  BEFORE_EXPIRATION: {
    label: 'Before Expiration',
    description: 'Before course access expires',
    icon: AlertTriangle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-100',
    category: 'engagement',
  },
  ON_CERTIFICATE_ISSUED: {
    label: 'Certificate Issued',
    description: 'When certificate is generated',
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    category: 'completion',
  },
}

export const TEMPLATE_DESCRIPTIONS: Record<string, TemplateInfo> = {
  'enrollment-welcome': {
    name: 'Enrollment Welcome',
    description: 'Sent immediately after enrollment',
  },
  'enrollment-nudge': {
    name: 'Enrollment Nudge',
    description: 'Sent if student enrolled but never started',
  },
  'course-started': {
    name: 'Course Started',
    description: 'Sent when student starts first lesson',
  },
  'halfway-milestone': {
    name: 'Halfway Milestone',
    description: 'Congratulation at 50% progress',
  },
  'course-completed': {
    name: 'Course Completed',
    description: 'Sent when all lessons are done',
  },
  'quiz-passed': {
    name: 'Quiz Passed',
    description: 'Sent when student passes a quiz',
  },
  'quiz-failed': {
    name: 'Quiz Failed',
    description: 'Encouragement to retry after failing',
  },
  'inactivity-7d': {
    name: '7-Day Inactivity',
    description: 'Reminder after 7 days inactive',
  },
  'inactivity-14d': {
    name: '14-Day Inactivity',
    description: 'Reminder after 14 days inactive',
  },
  'expiration-7d': {
    name: '7-Day Expiration Warning',
    description: 'Warning 7 days before access expires',
  },
  'expiration-1d': {
    name: '1-Day Expiration Warning',
    description: 'Urgent warning 1 day before expiry',
  },
  'certificate-issued': {
    name: 'Certificate Issued',
    description: 'Certificate download notification',
  },
}

export const TIMING_OPTIONS: Record<string, { label: string; value: number }[]> = {
  AFTER_ENROLLMENT: [
    { label: 'Immediately', value: 0 },
    { label: '15 minutes after', value: 15 },
    { label: '1 hour after', value: 60 },
    { label: '24 hours after', value: 1440 },
    { label: '48 hours after', value: 2880 },
    { label: '72 hours after', value: 4320 },
  ],
  ON_INACTIVITY: [
    { label: '3 days', value: 4320 },
    { label: '7 days', value: 10080 },
    { label: '14 days', value: 20160 },
    { label: '30 days', value: 43200 },
  ],
  BEFORE_EXPIRATION: [
    { label: '1 day before', value: 1440 },
    { label: '3 days before', value: 4320 },
    { label: '7 days before', value: 10080 },
    { label: '14 days before', value: 20160 },
  ],
  default: [{ label: 'Immediately', value: 0 }],
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{{firstName}}', desc: 'Student first name' },
  { key: '{{fullName}}', desc: 'Student full name' },
  { key: '{{email}}', desc: 'Student email' },
  { key: '{{courseTitle}}', desc: 'Course title' },
  { key: '{{courseUrl}}', desc: 'Course URL' },
  { key: '{{continueUrl}}', desc: 'Continue learning URL' },
  { key: '{{progressPercent}}', desc: 'Progress percentage' },
  { key: '{{lessonsCompleted}}', desc: 'Lessons completed count' },
  { key: '{{totalLessons}}', desc: 'Total lessons count' },
  { key: '{{quizTitle}}', desc: 'Quiz title (quiz notifications)' },
  { key: '{{quizScore}}', desc: 'Quiz score (quiz notifications)' },
  { key: '{{expiresDate}}', desc: 'Access expiration date' },
  { key: '{{certificateUrl}}', desc: 'Certificate URL' },
]

export const CATEGORY_LABELS: Record<string, string> = {
  enrollment: 'Enrollment',
  progress: 'Progress & Milestones',
  quiz: 'Quiz Results',
  engagement: 'Engagement & Reminders',
  completion: 'Completion & Certificates',
}

export const CATEGORY_ORDER = ['enrollment', 'progress', 'quiz', 'engagement', 'completion']
