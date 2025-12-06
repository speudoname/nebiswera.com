'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
  src: string // Regular video URL (fallback)
  hlsSrc?: string | null // HLS manifest URL (preferred)
  poster?: string | null
  className?: string
}

/**
 * Adaptive video player that uses HLS when available, falls back to regular video
 */
export function VideoPlayer({ src, hlsSrc, poster, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [useHls, setUseHls] = useState(false)

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
      setUseHls(false)
      return
    }

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSrc
      setUseHls(true)
      return
    }

    // Dynamically import hls.js for other browsers
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        // HLS not supported, fall back to regular video
        video.src = src
        setUseHls(false)
        return
      }

      const hls = new Hls({
        startLevel: -1, // Auto quality selection
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
          setUseHls(false)
        }
      })

      setUseHls(true)
    }).catch(() => {
      // Failed to load hls.js, use regular video
      video.src = src
      setUseHls(false)
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, hlsSrc])

  return (
    <video
      ref={videoRef}
      poster={poster || undefined}
      controls
      preload="metadata"
      playsInline
      className={className}
    >
      Your browser does not support the video tag.
    </video>
  )
}
