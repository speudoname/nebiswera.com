/**
 * useInteractionTiming Hook
 *
 * Calculates which interactions should be displayed based on current video time
 */

'use client'

import { useEffect, useState } from 'react'

interface InteractionData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: Record<string, unknown>
}

interface UseInteractionTimingParams {
  currentTime: number
  interactions: InteractionData[]
}

interface UseInteractionTimingResult {
  activeInteractions: InteractionData[]
  dismissInteraction: (id: string) => void
}

export function useInteractionTiming({
  currentTime,
  interactions,
}: UseInteractionTimingParams): UseInteractionTimingResult {
  const [activeInteractions, setActiveInteractions] = useState<InteractionData[]>([])

  // Check for interactions that should be shown
  useEffect(() => {
    const currentSecond = Math.floor(currentTime)

    const newActiveInteractions = interactions.filter((interaction) => {
      const triggerTime = interaction.triggerTime
      // Show interaction for 30 seconds or until dismissed
      return currentSecond >= triggerTime && currentSecond < triggerTime + 30
    })

    // Only update if changed
    if (JSON.stringify(newActiveInteractions.map(i => i.id)) !==
        JSON.stringify(activeInteractions.map(i => i.id))) {
      setActiveInteractions(newActiveInteractions)
    }
  }, [currentTime, interactions, activeInteractions])

  const dismissInteraction = (interactionId: string) => {
    setActiveInteractions((prev) => prev.filter((i) => i.id !== interactionId))
  }

  return {
    activeInteractions,
    dismissInteraction,
  }
}
