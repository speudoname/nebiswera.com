/**
 * Default Values for New Interactions
 *
 * Centralized default configuration to avoid duplication
 */

import type { Interaction } from './interactionTypes'

/**
 * Default values for creating a new interaction
 * Used when opening the "Add Interaction" modal
 */
export const DEFAULT_INTERACTION: Partial<Interaction> = {
  type: 'POLL',
  triggerTime: 0,
  duration: 30,
  title: '',
  config: {},
  pauseVideo: false,
  required: false,
  showOnReplay: true,
  position: 'BOTTOM_RIGHT',
  enabled: true,
}

/**
 * Get a fresh copy of default interaction values
 * Use this instead of spreading DEFAULT_INTERACTION to avoid mutation
 */
export function getDefaultInteraction(): Partial<Interaction> {
  return {
    ...DEFAULT_INTERACTION,
    config: {}, // Ensure config is a fresh object
  }
}
