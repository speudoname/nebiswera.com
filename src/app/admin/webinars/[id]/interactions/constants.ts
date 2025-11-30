/**
 * Z-Index Layer System for Interaction Builder
 * Standardized z-index values to ensure proper layering
 */
export const Z_INDEX = {
  VIDEO_PLAYER: 'z-0',
  TIMELINE_CONTAINER: 'z-50',
  TIMELINE_MARKERS: 'z-[60]',
  MINIMAP: 'z-[100]',
  TOOLTIP: 'z-[200]',
  MODAL_OVERLAY: 'z-50',
} as const

/**
 * Default values for new interactions
 */
export const DEFAULT_INTERACTION = {
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
} as const
