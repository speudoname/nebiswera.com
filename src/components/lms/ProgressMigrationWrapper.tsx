'use client'

/**
 * Progress Migration Wrapper
 *
 * Client component that wraps the ProgressMigrationBanner.
 * Can be included in authenticated layouts to show migration prompt.
 */

import { ProgressMigrationBanner } from './ProgressMigrationBanner'

export function ProgressMigrationWrapper() {
  return <ProgressMigrationBanner />
}
