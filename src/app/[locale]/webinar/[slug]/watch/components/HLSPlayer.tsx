'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

interface HLSPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  onError?: (error: string) => void
  onQualityChange?: (level: number, label: string) => void
  className?: string
  initialTime?: number
}

interface QualityLevel {
  index: number
  height: number
  width: number
  bitrate: number
  name: string
}

export function HLSPlayer({
  src,
  poster,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
  onError,
  onQualityChange,
  className = '',
  initialTime = 0,
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState(-1) // -1 = auto
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true)
        if (initialTime > 0) {
          video.currentTime = initialTime
        }
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay was prevented, user must interact
          })
        }
      })
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
        hls.loadSource(src)
      })

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsReady(true)

        // Extract quality levels
        const levels: QualityLevel[] = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          name: `${level.height}p`,
        }))
        setQualityLevels(levels)

        if (initialTime > 0) {
          video.currentTime = initialTime
        }

        if (autoPlay) {
          video.play().catch(() => {})
        }
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level)
        const level = hls.levels[data.level]
        if (level && onQualityChange) {
          onQualityChange(data.level, `${level.height}p`)
        }
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
    } else {
      onError?.('HLS is not supported in this browser')
    }
  }, [src, autoPlay, initialTime, onError, onQualityChange])

  // Handle time updates
  useEffect(() => {
    const video = videoRef.current
    if (!video || !onTimeUpdate) return

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime, video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [onTimeUpdate])

  // Handle video ended
  useEffect(() => {
    const video = videoRef.current
    if (!video || !onEnded) return

    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [onEnded])

  const setQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level
      setCurrentQuality(level)
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const play = () => videoRef.current?.play()
  const pause = () => videoRef.current?.pause()
  const getCurrentTime = () => videoRef.current?.currentTime || 0
  const getDuration = () => videoRef.current?.duration || 0

  return (
    <div
      className={`relative bg-black ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full"
        controls
        playsInline
      />

      {/* Quality selector overlay */}
      {qualityLevels.length > 1 && showControls && (
        <div className="absolute bottom-16 right-4 bg-black/80 rounded-lg p-2">
          <select
            value={currentQuality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            className="bg-transparent text-white text-sm border-none focus:outline-none cursor-pointer"
          >
            <option value={-1} className="bg-black">Auto</option>
            {qualityLevels.map((level) => (
              <option key={level.index} value={level.index} className="bg-black">
                {level.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// Export utility functions for external control
export function useHLSPlayerRef() {
  const playerRef = useRef<{
    seekTo: (time: number) => void
    play: () => void
    pause: () => void
    getCurrentTime: () => number
    getDuration: () => number
  } | null>(null)

  return playerRef
}
