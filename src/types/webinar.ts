/**
 * Webinar Type Definitions
 *
 * Centralized type definitions for webinars, interactions, and sessions
 */

/**
 * Interaction types - matches database enum
 */
export type InteractionType =
  | 'POLL'
  | 'QUESTION'
  | 'CTA'
  | 'DOWNLOAD'
  | 'FEEDBACK'
  | 'TIP'
  | 'SPECIAL_OFFER'
  | 'PAUSE'
  | 'QUIZ'
  | 'CONTACT_FORM'

/**
 * Interaction position on screen
 */
export type InteractionPosition =
  | 'TOP_LEFT'
  | 'TOP_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_RIGHT'
  | 'CENTER'
  | 'SIDEBAR'
  | 'FULL_OVERLAY'

/**
 * Interaction config varies by type. Common properties documented here:
 * - POLL: { options: string[], multipleChoice: boolean, description?: string }
 * - CTA: { buttonText: string, buttonUrl: string, openInNewTab: boolean }
 * - FEEDBACK: { feedbackType: 'stars' | 'thumbs' | 'emoji' }
 * - QUESTION: { placeholder?: string }
 * - DOWNLOAD: { downloadUrl: string, fileName: string }
 * - TIP: { tipText?: string }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InteractionConfig = Record<string, any>

/**
 * Base interaction data - used by player/viewer components
 * This is what the API returns for public consumption
 */
export interface InteractionData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: InteractionConfig
}

/**
 * Full interaction data - used by admin/editor components
 * Extends base with all editable fields
 */
export interface InteractionDataFull {
  id?: string
  type: InteractionType
  triggerTime: number
  title: string
  description?: string
  config: InteractionConfig
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  dismissable: boolean
  position: InteractionPosition
  enabled: boolean
  duration?: number
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
  interactions?: InteractionData[]
}

/**
 * Webinar with full relations (for admin use)
 */
export interface WebinarWithRelations extends Webinar {
  interactions: InteractionData[]
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
 * Interaction types that have poll/quiz options
 */
const INTERACTION_TYPES_WITH_OPTIONS: InteractionType[] = ['POLL', 'QUIZ']

/**
 * Type guards
 */
export function isInteractionType(value: string): value is InteractionType {
  const validTypes: InteractionType[] = [
    'POLL', 'QUESTION', 'CTA', 'DOWNLOAD', 'FEEDBACK',
    'TIP', 'SPECIAL_OFFER', 'PAUSE', 'QUIZ', 'CONTACT_FORM'
  ]
  return validTypes.includes(value as InteractionType)
}

export function hasOptions(interaction: InteractionData | InteractionDataFull): boolean {
  return INTERACTION_TYPES_WITH_OPTIONS.includes(interaction.type as InteractionType)
}

export function requiresCorrectAnswer(interaction: InteractionData | InteractionDataFull): boolean {
  return interaction.type === 'QUIZ'
}
