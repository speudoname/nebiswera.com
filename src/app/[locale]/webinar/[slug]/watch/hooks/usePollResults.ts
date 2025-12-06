/**
 * usePollResults Hook
 *
 * Fetches and polls for real-time poll/quiz results
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PollOptionResult {
  option: string
  index: number
  count: number
  percentage: number
}

export interface PollResults {
  options: PollOptionResult[]
  totalResponses: number
  userResponse: number[] | null
  hasResponded: boolean
}

interface UsePollResultsParams {
  slug: string
  accessToken: string
  interactionId: string
  enabled: boolean // Only fetch when user has answered
  pollInterval?: number // How often to refresh results (ms)
}

export function usePollResults({
  slug,
  accessToken,
  interactionId,
  enabled,
  pollInterval = 5000, // Default: refresh every 5 seconds
}: UsePollResultsParams) {
  const [results, setResults] = useState<PollResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchResults = useCallback(async () => {
    if (!enabled) return

    try {
      const response = await fetch(
        `/api/webinars/${slug}/interactions/${interactionId}/results?token=${accessToken}`
      )

      if (response.ok) {
        const data = await response.json()
        if (data.results) {
          setResults(data.results)
          setError(null)
        }
      } else {
        setError('Failed to fetch results')
      }
    } catch (err) {
      console.error('Failed to fetch poll results:', err)
      setError('Failed to fetch results')
    }
  }, [slug, accessToken, interactionId, enabled])

  // Initial fetch when enabled
  useEffect(() => {
    if (enabled && !results) {
      setIsLoading(true)
      fetchResults().finally(() => setIsLoading(false))
    }
  }, [enabled, fetchResults, results])

  // Set up polling interval
  useEffect(() => {
    if (enabled && pollInterval > 0) {
      intervalRef.current = setInterval(fetchResults, pollInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [enabled, pollInterval, fetchResults])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const refresh = useCallback(() => {
    return fetchResults()
  }, [fetchResults])

  return {
    results,
    isLoading,
    error,
    refresh,
  }
}
