/**
 * Webinar Type Definitions
 *
 * Centralized type definitions for webinars, interactions, and sessions
 * Consolidates 7 different Interaction interface definitions
 */

/**
 * Interaction types enum
 */
export enum InteractionType {
  POLL = 'poll',
  QUIZ = 'quiz',
  QA = 'qa',
  CTA = 'cta',
  SURVEY = 'survey'
}

/**
 * Interaction option for polls and quizzes
 */
export interface InteractionOption {
  id: string
  text: string
  isCorrect?: boolean
}

/**
 * Base interaction interface
 * Used across webinar player, admin editor, and analytics
 */
export interface Interaction {
  id: string
  webinarId: string
  type: InteractionType
  timestamp: number
  duration?: number
  question: string
  options?: InteractionOption[]
  correctAnswer?: string
  ctaText?: string
  ctaUrl?: string
  required?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Interaction response from a user
 */
export interface InteractionResponse {
  id: string
  interactionId: string
  userId?: string
  sessionId: string
  answer: string
  timestamp: number
  isCorrect?: boolean
  createdAt: Date
}

/**
 * Webinar session data
 * Represents a single viewing session
 */
export interface WebinarSession {
  id: string
  webinarId: string
  userId?: string
  email?: string
  startedAt: Date
  endedAt?: Date
  lastPosition: number
  completed: boolean
  interactionResponses?: InteractionResponse[]
}

/**
 * Webinar metadata
 */
export interface Webinar {
  id: string
  slug: string
  title: string
  description?: string
  thumbnailUrl?: string
  videoUrl: string
  duration: number
  published: boolean
  visibility: 'public' | 'private' | 'unlisted'
  requiresAuth: boolean
  requiresRegistration: boolean
  allowedDomains?: string[]
  createdAt: Date
  updatedAt: Date
  interactions?: Interaction[]
}

/**
 * Webinar with full relations (for admin use)
 */
export interface WebinarWithRelations extends Webinar {
  interactions: Interaction[]
  sessions: WebinarSession[]
  _count?: {
    sessions: number
    interactions: number
  }
}

/**
 * Webinar access check result
 */
export interface WebinarAccessResult {
  hasAccess: boolean
  reason?: 'not_published' | 'requires_auth' | 'requires_registration' | 'domain_restricted'
  webinar?: Webinar
}

/**
 * Type guards
 */
export function isInteractionType(value: string): value is InteractionType {
  return Object.values(InteractionType).includes(value as InteractionType)
}

export function hasOptions(interaction: Interaction): boolean {
  return interaction.type === InteractionType.POLL ||
         interaction.type === InteractionType.QUIZ ||
         interaction.type === InteractionType.SURVEY
}

export function requiresCorrectAnswer(interaction: Interaction): boolean {
  return interaction.type === InteractionType.QUIZ
}
