/**
 * LMS Library - Learning Management System Utilities
 *
 * Export all LMS-related types, functions, and constants
 */

// Types
export * from './types'

// Progress utilities
export * from './progress'

// Course utilities
export * from './course-utils'

// Certificate generation
export * from './certificates'

// Database queries
export * from './queries'

// Client-side local storage (for guest progress)
export * from './local-storage'

// React hooks
export { useLocalProgress } from './use-local-progress'
export { useProgressMigration } from './use-progress-migration'
