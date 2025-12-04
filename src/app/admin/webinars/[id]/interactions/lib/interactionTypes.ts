/**
 * Interaction Type Definitions and Constants
 *
 * Centralized definitions for all interaction types and their metadata
 */

import {
  BarChart2,
  MousePointer,
  Download,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Gift,
  Pause,
  HelpCircle,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

// ===========================================
// TypeScript Interfaces
// ===========================================

export interface Interaction {
  id: string
  type: string
  triggerTime: number
  duration: number | null
  title: string
  config: Record<string, unknown>
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  position: string
  enabled: boolean
}

export interface InteractionType {
  value: string
  label: string
  icon: LucideIcon
  description: string
}

export interface Position {
  value: string
  label: string
}

// ===========================================
// Interaction Types
// ===========================================

export const INTERACTION_TYPES: InteractionType[] = [
  { value: 'POLL', label: 'Poll', icon: BarChart2, description: 'Multiple choice question' },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle, description: 'Quiz with correct answers' },
  { value: 'CTA', label: 'Call to Action', icon: MousePointer, description: 'Button with link' },
  { value: 'DOWNLOAD', label: 'Download', icon: Download, description: 'Downloadable resource' },
  { value: 'QUESTION', label: 'Question', icon: MessageSquare, description: 'Open-ended Q&A' },
  { value: 'FEEDBACK', label: 'Feedback', icon: ThumbsUp, description: 'Rating/emoji feedback' },
  { value: 'CONTACT_FORM', label: 'Contact Form', icon: UserPlus, description: 'Lead capture form' },
  { value: 'TIP', label: 'Tip', icon: Lightbulb, description: 'Info tooltip' },
  { value: 'SPECIAL_OFFER', label: 'Special Offer', icon: Gift, description: 'Timed offer' },
  { value: 'PAUSE', label: 'Pause', icon: Pause, description: 'Pause video temporarily' },
]

// ===========================================
// Interaction Positions
// ===========================================

export const POSITIONS: Position[] = [
  { value: 'BOTTOM_RIGHT', label: 'Bottom Right' },
  { value: 'BOTTOM_LEFT', label: 'Bottom Left' },
  { value: 'TOP_RIGHT', label: 'Top Right' },
  { value: 'TOP_LEFT', label: 'Top Left' },
  { value: 'CENTER', label: 'Center' },
  { value: 'FULL_OVERLAY', label: 'Full Overlay' },
]

// ===========================================
// Helper Functions
// ===========================================

/**
 * Get icon component for an interaction type
 * @param type - Interaction type value
 * @returns Lucide icon component
 */
export function getInteractionIcon(type: string): LucideIcon {
  const interactionType = INTERACTION_TYPES.find((t) => t.value === type)
  return interactionType?.icon || BarChart2
}

/**
 * Get label for an interaction type
 * @param type - Interaction type value
 * @returns Human-readable label
 */
export function getInteractionLabel(type: string): string {
  const interactionType = INTERACTION_TYPES.find((t) => t.value === type)
  return interactionType?.label || type
}
