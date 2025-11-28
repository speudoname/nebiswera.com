'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

interface HeroVideoProps {
  hlsSrc: string
  mp4Fallback: string
  poster: string
  className?: string
}

export interface HeroVideoRef {
  muted: boolean
  setMuted: (muted: boolean) => void
}

/**
 * Hero video player optimized for instant playback using HLS streaming
 * - Uses HLS for instant start (no buffering wait)
 * - Falls back to MP4 for unsupported browsers
 * - Autoplay, muted, loop - perfect for hero sections
 */
export const HeroVideo = forwardRef<HeroVideoRef, HeroVideoProps>(
  ({ hlsSrc, mp4Fallback, poster, className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<any>(null)
    const [isMuted, setIsMuted] = useState(true)

    useImperativeHandle(ref, () => ({
      get muted() {
        return videoRef.current?.muted ?? true
      },
      setMuted(muted: boolean) {
        if (videoRef.current) {
          videoRef.current.muted = muted
          setIsMuted(muted)
        }
      },
    }))

    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      // Check if browser supports HLS natively (Safari, iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsSrc
        video.play().catch(() => {})
        return
      }

      // Dynamically import hls.js for other browsers
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          // HLS not supported, fall back to MP4
          video.src = mp4Fallback
          video.play().catch(() => {})
          return
        }

        const hls = new Hls({
          startLevel: -1, // Auto quality selection
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: false,
        })

        hlsRef.current = hls
        hls.attachMedia(video)

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(hlsSrc)
        })

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.error('HLS error, falling back to MP4:', data.type)
            hls.destroy()
            hlsRef.current = null
            video.src = mp4Fallback
            video.play().catch(() => {})
          }
        })
      }).catch(() => {
        // Failed to load hls.js, use MP4
        video.src = mp4Fallback
        video.play().catch(() => {})
      })

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
      }
    }, [hlsSrc, mp4Fallback])

    return (
      <video
        ref={videoRef}
        className={className}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        // @ts-expect-error - fetchPriority is valid but not in React types yet
        fetchPriority="high"
      />
    )
  }
)

HeroVideo.displayName = 'HeroVideo'
