/**
 * Registration Type Definitions
 *
 * Centralized type definitions for webinar registrations
 * Consolidates 5 different Registration interface definitions
 */

/**
 * Registration field types
 */
export enum RegistrationFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  TEXTAREA = 'textarea'
}

/**
 * Registration field definition
 */
export interface RegistrationField {
  id: string
  webinarId: string
  name: string
  label: string
  type: RegistrationFieldType
  required: boolean
  order: number
  options?: string[]
  placeholder?: string
  helpText?: string
  validation?: {
    pattern?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
  }
}

/**
 * Registration field value
 */
export interface RegistrationFieldValue {
  fieldId: string
  value: string
}

/**
 * Webinar registration status
 */
export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled'
}

/**
 * Base registration interface
 */
export interface Registration {
  id: string
  webinarId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  status: RegistrationStatus
  fieldValues?: RegistrationFieldValue[]
  registeredAt: Date
  confirmedAt?: Date
  attendedAt?: Date
  cancelledAt?: Date
  metadata?: Record<string, any>
}

/**
 * Registration with relations
 */
export interface RegistrationWithRelations extends Registration {
  webinar?: {
    id: string
    slug: string
    title: string
  }
  sessions?: {
    id: string
    startedAt: Date
    endedAt?: Date
    completed: boolean
  }[]
  contact?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

/**
 * Registration form data (for submission)
 */
export interface RegistrationFormData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  customFields?: Record<string, string>
  consent?: boolean
  source?: string
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

/**
 * Registration validation result
 */
export interface RegistrationValidationResult {
  valid: boolean
  errors?: {
    field: string
    message: string
  }[]
}

/**
 * Registration export data
 */
export interface RegistrationExport {
  webinarId: string
  webinarTitle: string
  registrations: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    company?: string
    status: RegistrationStatus
    registeredAt: string
    confirmedAt?: string
    attendedAt?: string
    [customField: string]: any
  }[]
  exportedAt: Date
}

/**
 * Registration settings
 */
export interface RegistrationSettings {
  webinarId: string
  enabled: boolean
  autoConfirm: boolean
  requireEmail: boolean
  requireName: boolean
  requirePhone: boolean
  requireCompany: boolean
  customFields: RegistrationField[]
  successMessage?: string
  confirmationEmailEnabled: boolean
  confirmationEmailTemplate?: string
  reminderEmailsEnabled: boolean
  reminderEmailSchedule?: {
    hours: number
    template?: string
  }[]
  maxRegistrations?: number
  closesAt?: Date
}

/**
 * Type guards
 */
export function isConfirmedRegistration(registration: Registration): boolean {
  return registration.status === RegistrationStatus.CONFIRMED ||
         registration.status === RegistrationStatus.ATTENDED
}

export function hasAttended(registration: Registration): boolean {
  return registration.status === RegistrationStatus.ATTENDED
}

export function isActiveRegistration(registration: Registration): boolean {
  return registration.status !== RegistrationStatus.CANCELLED
}

/**
 * Helper to get full name
 */
export function getFullName(registration: Registration): string {
  const parts = [registration.firstName, registration.lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : registration.email
}
