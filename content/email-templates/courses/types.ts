export interface CourseEmailTemplate {
  subject: string
  previewText: string
  html: string
  text: string
}

export interface CourseTemplateVariables {
  // Student info
  firstName: string
  fullName: string
  email: string

  // Course info
  courseTitle: string
  courseUrl: string
  continueUrl: string

  // Progress info
  progressPercent: number
  lessonsCompleted: number
  totalLessons: number
  timeSpent?: string // Formatted time string

  // Enrollment info
  enrolledDate: string
  expiresDate?: string
  daysUntilExpiry?: number

  // Quiz info (for quiz notifications)
  quizTitle?: string
  quizScore?: number
  passingScore?: number
  attemptsRemaining?: number

  // Certificate (for completion)
  certificateUrl?: string
  certificateId?: string

  // Activity
  lastActivityDate?: string
  daysInactive?: number
  currentLesson?: string

  // Unsubscribe
  unsubscribeUrl?: string
}
