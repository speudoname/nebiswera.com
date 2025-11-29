'use client'

import { useEffect, useState } from 'react'
import { Clock, Calendar, User } from 'lucide-react'

interface WaitingRoomProps {
  webinarTitle: string
  thumbnailUrl?: string
  presenterName?: string
  startsAt: Date
  onStart?: () => void
}

export function WaitingRoom({
  webinarTitle,
  thumbnailUrl,
  presenterName,
  startsAt,
  onStart,
}: WaitingRoomProps) {
  const [countdown, setCountdown] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date()
      const diff = startsAt.getTime() - now.getTime()

      if (diff <= 0) {
        setHasStarted(true)
        setCountdown(null)
        onStart?.()
        return null
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds }
    }

    // Initial calculation
    setCountdown(calculateCountdown())

    // Update every second
    const interval = setInterval(() => {
      const result = calculateCountdown()
      if (result) {
        setCountdown(result)
      } else {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startsAt, onStart])

  if (hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-neu-base rounded-xl p-8">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4" />
        <p className="text-text-primary text-lg">Starting webinar...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-8 text-white">
      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="w-full max-w-md mb-8 rounded-lg overflow-hidden shadow-2xl">
          <img
            src={thumbnailUrl}
            alt={webinarTitle}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
        {webinarTitle}
      </h1>

      {/* Presenter */}
      {presenterName && (
        <div className="flex items-center gap-2 text-white/80 mb-8">
          <User className="w-5 h-5" />
          <span>with {presenterName}</span>
        </div>
      )}

      {/* Countdown */}
      {countdown && (
        <div className="mb-8">
          <p className="text-center text-white/60 mb-4 flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Starting in
          </p>
          <div className="flex gap-4">
            {countdown.days > 0 && (
              <CountdownUnit value={countdown.days} label="Days" />
            )}
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Min" />
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </div>
        </div>
      )}

      {/* Start time */}
      <div className="flex items-center gap-2 text-white/60">
        <Calendar className="w-5 h-5" />
        <span>
          {startsAt.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-white/10 rounded-lg p-4 max-w-md">
        <p className="text-sm text-white/80 text-center">
          Stay on this page. The webinar will start automatically when it&apos;s time.
        </p>
      </div>
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg w-16 h-16 flex items-center justify-center mb-2">
        <span className="text-3xl font-bold font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-white/60 uppercase tracking-wider">{label}</span>
    </div>
  )
}
