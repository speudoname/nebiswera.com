'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { TIMING } from '@/lib/webinar/constants'
import { formatTime } from '@/lib'

interface WebinarPlayerProps {
  hlsUrl: string
  playbackMode: 'simulated_live' | 'replay'
  allowSeeking: boolean
  startPosition: number
  duration?: number
  poster?: string
  isPausedForInteraction?: boolean
  pauseMessage?: string
  slug?: string
  accessToken?: string
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
  isPausedForInteraction = false,
  pauseMessage,
  slug,
  accessToken,
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
  const wasPlayingBeforeInteraction = useRef(false)

  // Jitter offset to distribute progress updates across users
  // This prevents all users from hitting the server at the same time
  const jitterOffset = useRef(Math.random() * TIMING.PROGRESS_JITTER_MAX_SECONDS)

  // Note: We no longer track excessive video events (VIDEO_STARTED, VIDEO_PLAYED, etc.)
  // Only essential events like VIDEO_COMPLETED are tracked at the room level

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
        xhrSetup: (xhr) => {
          // Ensure referrer is sent for Bunny.net CDN hotlink protection
          xhr.withCredentials = false
        },
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

    // Set start position based on playback mode
    if (startPosition > 0) {
      // Cap at video duration - 1 to avoid seeking past end
      const targetPosition = Math.min(startPosition, Math.max(0, dur - 1))

      if (playbackMode === 'simulated_live') {
        // Simulated live: position is calculated from session start time
        // This ensures if user refreshes, they continue at the right spot
        video.currentTime = targetPosition
        lastValidTime.current = targetPosition
        lastReportedTime.current = targetPosition // Avoid immediate progress report
      } else if (allowSeeking) {
        // On-demand/replay: resume from last watched position
        video.currentTime = targetPosition
        lastReportedTime.current = targetPosition
      }
    }

    // Auto-play after a short delay to ensure seeking has completed
    setTimeout(() => {
      video.play().catch((error) => {
        // Autoplay was prevented - this is common on mobile
        console.log('Autoplay prevented, user interaction required:', error)
      })
    }, 100)
  }, [startPosition, allowSeeking, playbackMode])

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const time = video.currentTime || 0
    setCurrentTime(time)

    // Report progress at regular intervals with jitter distribution
    // Jitter ensures users don't all hit the server at the same time
    const timeSinceLastReport = time - lastReportedTime.current
    const reportInterval = TIMING.PROGRESS_UPDATE_INTERVAL_SECONDS + jitterOffset.current

    if (Math.abs(timeSinceLastReport) >= reportInterval) {
      lastReportedTime.current = time
      const progress = videoDuration > 0 ? (time / videoDuration) * 100 : 0
      onTimeUpdate?.(time, progress)

      // Reset jitter for next interval (new random offset)
      jitterOffset.current = Math.random() * TIMING.PROGRESS_JITTER_MAX_SECONDS
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

  // Handle pause
  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  // Handle error
  const handleError = useCallback(() => {
    const errorDetails = videoRef.current?.error
    // Log error to console for debugging
    console.error('Video playback error:', {
      code: errorDetails?.code,
      message: errorDetails?.message || 'Unknown error',
    })
    onError?.('Video playback error')
  }, [onError])

  // Prevent seeking backwards in simulated live mode
  const handleSeeking = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Prevent backwards seeking in live mode
    if (!allowSeeking && playbackMode === 'simulated_live') {
      if (video.currentTime < lastValidTime.current - 1) {
        video.currentTime = lastValidTime.current
      }
    }
  }, [allowSeeking, playbackMode])

  // Handle interaction-based pausing
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPausedForInteraction) {
      // Save current playing state before pausing
      wasPlayingBeforeInteraction.current = !video.paused
      video.pause()
    } else if (wasPlayingBeforeInteraction.current) {
      // Auto-resume if video was playing before interaction
      video.play().catch(() => {
        // Autoplay prevented
      })
      wasPlayingBeforeInteraction.current = false
    }
  }, [isPausedForInteraction])

  // Calculate progress percentage
  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  const togglePlayPause = () => {
    // Don't allow manual pause/play when paused for interaction
    if (isPausedForInteraction) return

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

      {/* Paused for interaction overlay */}
      {isPausedForInteraction && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              <p className="text-white text-lg font-medium">Video Paused</p>
            </div>
            {pauseMessage && (
              <p className="text-white/80 text-sm text-center max-w-md">{pauseMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls={playbackMode === 'replay'}
        controlsList={playbackMode === 'replay' ? undefined : 'nodownload nofullscreen noplaybackrate'}
        disablePictureInPicture={playbackMode !== 'replay'}
        playsInline
        crossOrigin="anonymous"
        onLoadedData={handleLoadedData}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Custom minimal controls for non-replay (simulated_live, on_demand) */}
      {playbackMode !== 'replay' && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
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

            {/* Live indicator for simulated_live only */}
            {playbackMode === 'simulated_live' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-semibold">LIVE</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
