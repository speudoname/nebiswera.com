'use client'

/**
 * React Hook for Progress Migration
 *
 * Handles migrating localStorage progress to server after user logs in.
 * Should be called once when user session becomes available.
 */

import { useState, useCallback } from 'react'
import { getAllProgressForMigration, clearAllLmsData, hasProgressToMigrate } from './local-storage'

interface MigrationResult {
  success: boolean
  migrated: string[]
  errors?: string[]
  message: string
}

interface UseProgressMigrationReturn {
  hasPendingMigration: boolean
  isMigrating: boolean
  migrateProgress: () => Promise<MigrationResult | null>
  clearLocalProgress: () => void
}

export function useProgressMigration(): UseProgressMigrationReturn {
  const [isMigrating, setIsMigrating] = useState(false)

  // Check if there's progress to migrate
  const hasPendingMigration = typeof window !== 'undefined' && hasProgressToMigrate()

  // Perform migration
  const migrateProgress = useCallback(async (): Promise<MigrationResult | null> => {
    if (typeof window === 'undefined') return null
    if (!hasProgressToMigrate()) return null

    setIsMigrating(true)

    try {
      const progressData = getAllProgressForMigration()

      const response = await fetch('/api/courses/migrate-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      })

      const result = await response.json()

      if (result.success) {
        // Clear local storage after successful migration
        clearAllLmsData()

        return {
          success: true,
          migrated: result.data.migrated || [],
          errors: result.data.errors,
          message: result.data.message || 'Progress migrated successfully',
        }
      } else {
        return {
          success: false,
          migrated: [],
          errors: [result.error || 'Unknown error'],
          message: result.error || 'Failed to migrate progress',
        }
      }
    } catch (error) {
      console.error('Progress migration failed:', error)
      return {
        success: false,
        migrated: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Failed to migrate progress',
      }
    } finally {
      setIsMigrating(false)
    }
  }, [])

  // Clear local progress without migration
  const clearLocalProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      clearAllLmsData()
    }
  }, [])

  return {
    hasPendingMigration,
    isMigrating,
    migrateProgress,
    clearLocalProgress,
  }
}
