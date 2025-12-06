/**
 * Notification Editor Types
 *
 * Shared types for notification-related components
 */

export interface NotificationAction {
  type: 'TAG_CONTACT'
  tagId: string
  tagName?: string
}

export interface Notification {
  id: string
  templateKey: string | null
  triggerType: string
  triggerMinutes: number
  triggerDescription?: string
  conditions: unknown
  channel: string
  subject: string | null
  bodyHtml: string | null
  bodyText: string | null
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
  }
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface EmailSettings {
  emailFromName: string
  emailFromAddress: string
}

export interface TemplateInfo {
  name: string
  description: string
  triggerType: 'AFTER_REGISTRATION' | 'BEFORE_START' | 'AFTER_END'
  triggerMinutes: number
  conditions: Record<string, unknown> | null
}

export const TEMPLATE_CONFIGS: Record<string, TemplateInfo> = {
  'registration-confirmation': {
    name: 'Registration Confirmation',
    description: 'Sent immediately when someone registers for the webinar',
    triggerType: 'AFTER_REGISTRATION',
    triggerMinutes: 0,
    conditions: null,
  },
  'reminder-24h': {
    name: '24 Hour Reminder',
    description: 'Sent 24 hours before the webinar starts',
    triggerType: 'BEFORE_START',
    triggerMinutes: 24 * 60,
    conditions: null,
  },
  'reminder-1h': {
    name: '1 Hour Reminder',
    description: 'Sent 1 hour before the webinar starts',
    triggerType: 'BEFORE_START',
    triggerMinutes: 60,
    conditions: null,
  },
  'starting-now': {
    name: 'Starting Now',
    description: 'Sent when the webinar is about to start (5 minutes before)',
    triggerType: 'BEFORE_START',
    triggerMinutes: 5,
    conditions: null,
  },
  'replay-available': {
    name: 'Replay Available',
    description: 'Sent after the webinar ends with replay link',
    triggerType: 'AFTER_END',
    triggerMinutes: 30,
    conditions: null,
  },
  'missed-webinar': {
    name: 'Missed Webinar',
    description: 'Sent to registrants who did not attend',
    triggerType: 'AFTER_END',
    triggerMinutes: 60,
    conditions: { attended: false },
  },
}

// Trigger type display names
export const TRIGGER_TYPES = {
  AFTER_REGISTRATION: 'After Registration',
  BEFORE_START: 'Before Start',
  AFTER_END: 'After End',
} as const

// Template variable helpers
export const TEMPLATE_VARIABLES = [
  { key: '{{firstName}}', description: 'Registrant first name' },
  { key: '{{lastName}}', description: 'Registrant last name' },
  { key: '{{email}}', description: 'Registrant email' },
  { key: '{{webinarTitle}}', description: 'Webinar title' },
  { key: '{{webinarDate}}', description: 'Webinar date' },
  { key: '{{webinarTime}}', description: 'Webinar time' },
  { key: '{{watchUrl}}', description: 'Watch URL' },
  { key: '{{replayUrl}}', description: 'Replay URL' },
] as const
