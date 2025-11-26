'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Stream, StreamPlayerApi } from '@cloudflare/stream-react'

interface WebinarPlayerProps {
  videoUid: string
  playbackMode: 'simulated_live' | 'on_demand' | 'replay'
  allowSeeking: boolean
  startPosition: number
  duration?: number
  onTimeUpdate?: (currentTime: number, progress: number) => void
  onVideoEnd?: () => void
  onVideoStart?: () => void
  onError?: (error: string) => void
}

export function WebinarPlayer({
  videoUid,
  playbackMode,
  allowSeeking,
  startPosition,
  duration,
  onTimeUpdate,
  onVideoEnd,
  onVideoStart,
  onError,
}: WebinarPlayerProps) {
  const streamRef = useRef<StreamPlayerApi | undefined>(undefined)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const lastReportedTime = useRef(0)

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    if (!streamRef.current) return

    const time = streamRef.current.currentTime || 0
    setCurrentTime(time)

    // Report progress every 5 seconds
    if (Math.abs(time - lastReportedTime.current) >= 5) {
      lastReportedTime.current = time
      const progress = videoDuration > 0 ? (time / videoDuration) * 100 : 0
      onTimeUpdate?.(time, progress)
    }
  }, [videoDuration, onTimeUpdate])

  // Handle video loaded
  const handleLoadedData = useCallback(() => {
    setIsLoading(false)
    if (streamRef.current) {
      const dur = streamRef.current.duration || 0
      setVideoDuration(dur)

      // Set start position for on-demand/replay
      if (startPosition > 0 && allowSeeking) {
        streamRef.current.currentTime = startPosition
      }

      // For simulated live, calculate current position
      if (playbackMode === 'simulated_live' && startPosition > 0) {
        // Don't allow seeking back, just set the time
        streamRef.current.currentTime = Math.min(startPosition, dur)
      }
    }
  }, [startPosition, allowSeeking, playbackMode])

  // Handle play
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    if (!hasStarted) {
      setHasStarted(true)
      onVideoStart?.()
    }
  }, [hasStarted, onVideoStart])

  // Handle ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    onVideoEnd?.()
  }, [onVideoEnd])

  // Handle error
  const handleError = useCallback(() => {
    onError?.('Video playback error')
  }, [onError])

  // Track last valid time for simulated live (to prevent seeking back)
  const lastValidTime = useRef(0)

  // Update last valid time for simulated live mode
  useEffect(() => {
    if (playbackMode === 'simulated_live' && currentTime > lastValidTime.current) {
      lastValidTime.current = currentTime
    }
  }, [playbackMode, currentTime])

  // Handle seeking for simulated live (called on every time update)
  useEffect(() => {
    if (!streamRef.current || allowSeeking || playbackMode !== 'simulated_live') return

    // If someone tries to seek backwards, push them back forward
    if (currentTime < lastValidTime.current - 1) {
      streamRef.current.currentTime = lastValidTime.current
    }
  }, [allowSeeking, playbackMode, currentTime])

  // Calculate progress percentage
  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Cloudflare Stream Player */}
      <div className={`w-full h-full ${!allowSeeking ? 'pointer-events-none' : ''}`}>
        <Stream
          streamRef={streamRef}
          src={videoUid}
          controls={allowSeeking}
          autoplay
          onLoadedData={handleLoadedData}
          onPlay={handlePlay}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
        />
      </div>

      {/* Custom controls for simulated live (no seeking) */}
      {!allowSeeking && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={() => {
                if (streamRef.current) {
                  if (isPlaying) {
                    streamRef.current.pause()
                  } else {
                    streamRef.current.play()
                  }
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Progress bar (non-interactive) */}
            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Time display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm">LIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
