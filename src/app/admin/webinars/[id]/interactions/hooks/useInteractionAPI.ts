/**
 * Custom Hook for Interaction API Operations
 *
 * Handles all CRUD operations for webinar interactions
 */

import { useState } from 'react'
import type { Interaction } from '../lib/interactionTypes'

interface UseInteractionAPIProps {
  webinarId: string
  onSuccess?: (message: string) => void
  onError?: (error: Error) => void
}

interface UseInteractionAPIReturn {
  addInteraction: (interaction: Partial<Interaction>) => Promise<Interaction | null>
  updateInteraction: (interaction: Interaction) => Promise<Interaction | null>
  deleteInteraction: (id: string) => Promise<boolean>
  moveInteraction: (id: string, newTime: number, currentInteractions: Interaction[]) => Promise<boolean>
  isLoading: boolean
}

export function useInteractionAPI({
  webinarId,
  onSuccess,
  onError,
}: UseInteractionAPIProps): UseInteractionAPIReturn {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Add a new interaction
   */
  const addInteraction = async (
    interaction: Partial<Interaction>
  ): Promise<Interaction | null> => {
    if (!interaction.title || !interaction.type) {
      const error = new Error('Title and type are required')
      onError?.(error)
      return null
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/webinars/${webinarId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interaction),
      })

      if (!response.ok) throw new Error('Failed to create interaction')

      const data = await response.json()
      onSuccess?.('Interaction added!')
      return data.interaction
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create interaction')
      console.error(err)
      onError?.(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update an existing interaction
   */
  const updateInteraction = async (
    interaction: Interaction
  ): Promise<Interaction | null> => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${interaction.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interaction),
        }
      )

      if (!response.ok) throw new Error('Failed to update interaction')

      const data = await response.json()
      onSuccess?.('Interaction updated!')
      return data.interaction
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update interaction')
      console.error(err)
      onError?.(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete an interaction
   */
  const deleteInteraction = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete interaction')

      onSuccess?.('Interaction deleted!')
      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete interaction')
      console.error(err)
      onError?.(err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Move an interaction to a new time (timeline drag)
   */
  const moveInteraction = async (
    id: string,
    newTime: number,
    currentInteractions: Interaction[]
  ): Promise<boolean> => {
    const interaction = currentInteractions.find((i) => i.id === id)
    if (!interaction) return false

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...interaction, triggerTime: newTime }),
        }
      )

      if (!response.ok) throw new Error('Failed to update interaction')

      return true
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Failed to update interaction position')
      console.error(err)
      onError?.(err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    addInteraction,
    updateInteraction,
    deleteInteraction,
    moveInteraction,
    isLoading,
  }
}
