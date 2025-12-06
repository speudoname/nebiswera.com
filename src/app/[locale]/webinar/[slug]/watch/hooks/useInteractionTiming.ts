/**
 * useInteractionTiming Hook
 *
 * Manages interaction states:
 * - activeInteractions: Currently showing, awaiting response
 * - answeredInteractions: User has responded, shows results
 * - allTriggeredInteractions: All interactions that have been triggered (for widgets tab)
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { InteractionData } from '@/types'

export interface AnsweredInteraction extends InteractionData {
  userResponse: unknown
  answeredAt: number
}

interface UseInteractionTimingParams {
  currentTime: number
  interactions: InteractionData[]
}

interface UseInteractionTimingResult {
  /** Interactions currently showing that haven't been answered/dismissed */
  activeInteractions: InteractionData[]
  /** Interactions user has answered (with their response) */
  answeredInteractions: AnsweredInteraction[]
  /** All interactions that have been triggered so far (active + answered) */
  allTriggeredInteractions: (InteractionData | AnsweredInteraction)[]
  /** Dismiss an interaction without answering */
  dismissInteraction: (id: string) => void
  /** Mark an interaction as answered */
  markAsAnswered: (id: string, response: unknown) => void
  /** Check if an interaction has been answered */
  isAnswered: (id: string) => boolean
  /** Get user's response for an interaction */
  getUserResponse: (id: string) => unknown | undefined
}

export function useInteractionTiming({
  currentTime,
  interactions,
}: UseInteractionTimingParams): UseInteractionTimingResult {
  // IDs of dismissed interactions (user closed without answering)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  // Answered interactions with their responses
  const [answeredMap, setAnsweredMap] = useState<Map<string, AnsweredInteraction>>(new Map())
  // Track which interactions have been triggered at least once
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set())

  // Calculate which interactions should currently be active (showing)
  const activeInteractions = interactions.filter((interaction) => {
    const triggerTime = interaction.triggerTime
    const currentSecond = Math.floor(currentTime)
    // Duration might be in config or we use a default of 30 seconds
    const duration = (interaction.config?.duration as number) || 30

    const isTriggered = currentSecond >= triggerTime
    const isWithinDuration = currentSecond < triggerTime + duration
    const isDismissed = dismissedIds.has(interaction.id)
    const isAnswered = answeredMap.has(interaction.id)

    // Show if: triggered, within duration, not dismissed, not answered
    return isTriggered && isWithinDuration && !isDismissed && !isAnswered
  })

  // Track triggered interactions
  useEffect(() => {
    const currentSecond = Math.floor(currentTime)

    interactions.forEach((interaction) => {
      if (currentSecond >= interaction.triggerTime && !triggeredIds.has(interaction.id)) {
        setTriggeredIds(prev => new Set(prev).add(interaction.id))
      }
    })
  }, [currentTime, interactions, triggeredIds])

  // Get answered interactions as array
  const answeredInteractions = Array.from(answeredMap.values())

  // All triggered interactions (for widgets tab)
  const allTriggeredInteractions: (InteractionData | AnsweredInteraction)[] = interactions
    .filter(i => triggeredIds.has(i.id))
    .map(i => answeredMap.get(i.id) || i)
    .sort((a, b) => a.triggerTime - b.triggerTime)

  const dismissInteraction = useCallback((interactionId: string) => {
    setDismissedIds(prev => new Set(prev).add(interactionId))
  }, [])

  const markAsAnswered = useCallback((interactionId: string, response: unknown) => {
    const interaction = interactions.find(i => i.id === interactionId)
    if (interaction) {
      setAnsweredMap(prev => {
        const newMap = new Map(prev)
        newMap.set(interactionId, {
          ...interaction,
          userResponse: response,
          answeredAt: Date.now(),
        })
        return newMap
      })
    }
  }, [interactions])

  const isAnswered = useCallback((interactionId: string) => {
    return answeredMap.has(interactionId)
  }, [answeredMap])

  const getUserResponse = useCallback((interactionId: string) => {
    return answeredMap.get(interactionId)?.userResponse
  }, [answeredMap])

  return {
    activeInteractions,
    answeredInteractions,
    allTriggeredInteractions,
    dismissInteraction,
    markAsAnswered,
    isAnswered,
    getUserResponse,
  }
}
