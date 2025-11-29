'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'

interface WebinarPlayerProps {
  hlsUrl: string
  playbackMode: 'simulated_live' | 'on_demand' | 'replay'
  allowSeeking: boolean
  startPosition: number
  duration?: number
  poster?: string
  onTimeUpdate?: (currentTime: number, progress: number) => void
  onVideoEnd?: () => void
  onVideoStart?: () => void
  onError?: (error: string) => void
}

export function WebinarPlayer({
  hlsUrl,
  playbackMode,
  allowSeeking,
  startPosition,
  duration,
  poster,
  onTimeUpdate,
  onVideoEnd,
  onVideoStart,
  onError,
}: WebinarPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const lastReportedTime = useRef(0)
  const lastValidTime = useRef(0)

  // Video source
  const videoSource = hlsUrl

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSource) return

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    setIsLoading(true)

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSource
      return
    }

    // Use HLS.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1, // Auto quality selection
        capLevelOnFPSDrop: true,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })

      hlsRef.current = hls
      hls.attachMedia(video)

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(videoSource)
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Ready to play
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error:', data)
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error:', data)
              hls.recoverMediaError()
              break
            default:
              console.error('HLS fatal error:', data)
              onError?.(`Video playback error: ${data.details}`)
              hls.destroy()
              break
          }
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (!video.canPlayType('application/vnd.apple.mpegurl')) {
      onError?.('HLS is not supported in this browser')
    }
  }, [videoSource, onError])

  // Handle video loaded
  const handleLoadedData = useCallback(() => {
    setIsLoading(false)
    const video = videoRef.current
    if (!video) return

    const dur = video.duration || 0
    setVideoDuration(dur)

    // Set start position for on-demand/replay
    if (startPosition > 0 && allowSeeking) {
      video.currentTime = startPosition
    }

    // For simulated live, calculate current position
    if (playbackMode === 'simulated_live' && startPosition > 0) {
      video.currentTime = Math.min(startPosition, dur)
      lastValidTime.current = video.currentTime
    }

    // Auto-play
    video.play().catch(() => {
      // Autoplay was prevented
    })
  }, [startPosition, allowSeeking, playbackMode])

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const time = video.currentTime || 0
    setCurrentTime(time)

    // Report progress every 5 seconds
    if (Math.abs(time - lastReportedTime.current) >= 5) {
      lastReportedTime.current = time
      const progress = videoDuration > 0 ? (time / videoDuration) * 100 : 0
      onTimeUpdate?.(time, progress)
    }

    // For simulated live, update last valid time
    if (playbackMode === 'simulated_live' && time > lastValidTime.current) {
      lastValidTime.current = time
    }
  }, [videoDuration, onTimeUpdate, playbackMode])

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

  // Prevent seeking backwards in simulated live mode
  const handleSeeking = useCallback(() => {
    const video = videoRef.current
    if (!video || allowSeeking || playbackMode !== 'simulated_live') return

    if (video.currentTime < lastValidTime.current - 1) {
      video.currentTime = lastValidTime.current
    }
  }, [allowSeeking, playbackMode])

  // Calculate progress percentage
  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

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

      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full ${!allowSeeking ? 'pointer-events-none' : ''}`}
        poster={poster}
        controls={allowSeeking}
        playsInline
        onLoadedData={handleLoadedData}
        onPlay={handlePlay}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Custom controls for simulated live (no seeking) */}
      {!allowSeeking && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayPause}
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
