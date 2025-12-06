'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAnalytics } from '@/providers/AnalyticsProvider'

// Analytics tracking milestones (percent)
const MILESTONES = [25, 50, 75, 90]

interface TrackedVideoPlayerProps {
  src: string // Regular video URL (fallback)
  hlsSrc?: string | null // HLS manifest URL (preferred)
  poster?: string | null
  className?: string
  // Tracking metadata
  videoId?: string // Bunny video ID or custom identifier
  videoTitle?: string // Human-readable title
  source?: string // Where the video is embedded (e.g., 'blog', 'homepage', 'landing')
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
}

/**
 * Video player with built-in analytics tracking.
 * Tracks: play, pause, progress milestones, completion, and seeks.
 * Uses the AnalyticsProvider context to record events to PageEvent.
 */
export function TrackedVideoPlayer({
  src,
  hlsSrc,
  poster,
  className = '',
  videoId,
  videoTitle,
  source,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
}: TrackedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const { trackEvent } = useAnalytics()

  // Tracking state refs (don't trigger re-renders)
  const hasStartedRef = useRef(false)
  const hasCompletedRef = useRef(false)
  const reachedMilestonesRef = useRef<Set<number>>(new Set())
  const lastSeekPositionRef = useRef(0)
  const sessionIdRef = useRef<string>('')

  // Generate session ID on mount
  useEffect(() => {
    sessionIdRef.current = `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }, [])

  // Build metadata for events
  const getMetadata = useCallback((extraData?: Record<string, unknown>) => {
    const video = videoRef.current
    return {
      videoId: videoId || 'unknown',
      videoTitle: videoTitle || 'Untitled Video',
      source: source || 'page',
      sessionId: sessionIdRef.current,
      position: video?.currentTime || 0,
      duration: video?.duration || 0,
      percent: video && video.duration > 0
        ? Math.round((video.currentTime / video.duration) * 100)
        : 0,
      ...extraData,
    }
  }, [videoId, videoTitle, source])

  // Track video event
  const trackVideoEvent = useCallback((
    eventType: 'VIDEO_PLAY' | 'VIDEO_PAUSE' | 'VIDEO_PROGRESS' | 'VIDEO_COMPLETE' | 'VIDEO_SEEKED',
    extraData?: Record<string, unknown>
  ) => {
    trackEvent(eventType, {
      elementId: videoId || undefined,
      elementText: videoTitle || undefined,
      targetUrl: hlsSrc || src,
      metadata: getMetadata(extraData),
    })
  }, [trackEvent, videoId, videoTitle, hlsSrc, src, getMetadata])

  // Set up HLS playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // If no HLS URL, use regular video
    if (!hlsSrc) {
      video.src = src
      return
    }

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSrc
      return
    }

    // Dynamically import hls.js for other browsers
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        video.src = src
        return
      }

      const hls = new Hls({
        startLevel: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
      })

      hlsRef.current = hls
      hls.attachMedia(video)

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(hlsSrc)
      })

      hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean }) => {
        if (data.fatal) {
          console.error('HLS error, falling back to regular video:', data)
          hls.destroy()
          hlsRef.current = null
          video.src = src
        }
      })
    }).catch(() => {
      video.src = src
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, hlsSrc])

  // Set up event listeners for tracking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true
        trackVideoEvent('VIDEO_PLAY', { firstPlay: true })
      } else {
        trackVideoEvent('VIDEO_PLAY', { resumed: true })
      }
    }

    const handlePause = () => {
      // Only track if video is not at the end
      if (video.currentTime < video.duration - 0.5) {
        trackVideoEvent('VIDEO_PAUSE')
      }
    }

    const handleTimeUpdate = () => {
      // Skip if completed and looping
      if (loop && hasCompletedRef.current) return

      const duration = video.duration
      if (duration > 0) {
        const percent = Math.round((video.currentTime / duration) * 100)

        for (const milestone of MILESTONES) {
          if (percent >= milestone && !reachedMilestonesRef.current.has(milestone)) {
            reachedMilestonesRef.current.add(milestone)
            trackVideoEvent('VIDEO_PROGRESS', { milestone, percent })
          }
        }
      }
    }

    const handleEnded = () => {
      if (loop && hasCompletedRef.current) return

      hasCompletedRef.current = true
      trackVideoEvent('VIDEO_COMPLETE')
    }

    const handleSeeking = () => {
      lastSeekPositionRef.current = video.currentTime
    }

    const handleSeeked = () => {
      const fromPosition = lastSeekPositionRef.current
      const toPosition = video.currentTime
      // Only track significant seeks (> 2 seconds)
      if (Math.abs(toPosition - fromPosition) > 2) {
        trackVideoEvent('VIDEO_SEEKED', { fromPosition, toPosition })
      }
    }

    // Add event listeners
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [trackVideoEvent, loop])

  return (
    <video
      ref={videoRef}
      poster={poster || undefined}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      preload="metadata"
      playsInline
      className={className}
    >
      Your browser does not support the video tag.
    </video>
  )
}
