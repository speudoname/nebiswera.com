'use client'

/**
 * Progress Migration Banner
 *
 * Shows after login if user has localStorage progress to migrate.
 * Gives them option to migrate or discard local progress.
 */

import { useState, useEffect } from 'react'
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useProgressMigration } from '@/lib/lms/use-progress-migration'

interface ProgressMigrationBannerProps {
  onMigrated?: () => void
}

export function ProgressMigrationBanner({ onMigrated }: ProgressMigrationBannerProps) {
  const { hasPendingMigration, isMigrating, migrateProgress, clearLocalProgress } =
    useProgressMigration()
  const [isVisible, setIsVisible] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Check on mount
  useEffect(() => {
    if (hasPendingMigration) {
      setIsVisible(true)
    }
  }, [hasPendingMigration])

  const handleMigrate = async () => {
    const result = await migrateProgress()

    if (result?.success) {
      setMigrationStatus('success')
      setStatusMessage(result.message)
      setTimeout(() => {
        setIsVisible(false)
        onMigrated?.()
      }, 2000)
    } else {
      setMigrationStatus('error')
      setStatusMessage(result?.message || 'Migration failed')
    }
  }

  const handleDismiss = () => {
    clearLocalProgress()
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
      {migrationStatus === 'idle' && (
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                Found Your Progress!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You have course progress saved on this device. Would you like to sync it to your
                account?
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync Progress'
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={isMigrating}
                  className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              disabled={isMigrating}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {migrationStatus === 'success' && (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{statusMessage}</p>
            </div>
          </div>
        </div>
      )}

      {migrationStatus === 'error' && (
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{statusMessage}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleMigrate}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDismiss}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
