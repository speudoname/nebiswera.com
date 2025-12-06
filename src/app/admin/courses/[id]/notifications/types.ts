import type { Bell } from 'lucide-react'

export interface NotificationAction {
  type: 'TAG_CONTACT'
  tagId: string
  tagName?: string
}

export interface CourseNotification {
  id: string
  templateKey: string | null
  trigger: string
  triggerMinutes: number
  triggerDescription: string
  conditions: Record<string, unknown> | null
  channel: string
  subject: string | null
  previewText: string | null
  bodyHtml: string | null
  bodyText: string | null
  bodyDesign: string | null
  fromName: string | null
  fromEmail: string | null
  replyTo: string | null
  actions: NotificationAction[] | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  stats?: {
    sent: number
    pending: number
    queued: number
    logged: number
  }
  createdAt: string
  updatedAt: string
}

export interface ContactTag {
  id: string
  name: string
  color: string
}

export interface EmailSettings {
  emailFromName: string
  emailFromAddress: string
}

export type TriggerType =
  | 'AFTER_ENROLLMENT'
  | 'ON_COURSE_START'
  | 'ON_LESSON_COMPLETE'
  | 'ON_MODULE_COMPLETE'
  | 'ON_COURSE_COMPLETE'
  | 'ON_QUIZ_PASS'
  | 'ON_QUIZ_FAIL'
  | 'ON_INACTIVITY'
  | 'BEFORE_EXPIRATION'
  | 'ON_CERTIFICATE_ISSUED'

export interface TriggerConfig {
  label: string
  description: string
  icon: typeof Bell
  color: string
  bgColor: string
  category: 'enrollment' | 'progress' | 'quiz' | 'engagement' | 'completion'
}

export interface TemplateInfo {
  name: string
  description: string
}

export interface TemplateVariable {
  key: string
  desc: string
}
