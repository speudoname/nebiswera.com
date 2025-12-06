/**
 * useWaitingRoom Hook
 *
 * Manages waiting room visibility for scheduled webinars
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { TIMING, minutesToMs } from '@/lib/webinar/constants'

interface UseWaitingRoomParams {
  sessionStartsAt?: Date
  playbackMode: 'simulated_live' | 'replay'
}

interface UseWaitingRoomResult {
  showWaitingRoom: boolean
  waitingRoomEnterTime: Date | null
  handleStart: () => void
}

export function useWaitingRoom({
  sessionStartsAt,
  playbackMode,
}: UseWaitingRoomParams): UseWaitingRoomResult {
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const waitingRoomEnterTime = useRef<Date | null>(null)

  // Check if we should show waiting room
  useEffect(() => {
    if (sessionStartsAt && playbackMode === 'simulated_live') {
      const now = new Date()
      // Show waiting room if session hasn't started yet (with early access window)
      const earlyAccess = new Date(sessionStartsAt.getTime() - minutesToMs(TIMING.EARLY_ACCESS_MINUTES))
      if (now < earlyAccess) {
        setShowWaitingRoom(true)
        waitingRoomEnterTime.current = new Date()
      }
    }
  }, [sessionStartsAt, playbackMode])

  const handleStart = () => {
    setShowWaitingRoom(false)
  }

  return {
    showWaitingRoom,
    waitingRoomEnterTime: waitingRoomEnterTime.current,
    handleStart,
  }
}
