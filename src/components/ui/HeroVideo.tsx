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
 * Hero video player optimized for LCP performance
 *
 * Key optimization: Shows poster as <img> immediately for fast LCP,
 * then loads video in background and swaps when ready.
 * This eliminates the "element render delay" caused by waiting for
 * HLS.js to load and video to initialize.
 */
export const HeroVideo = forwardRef<HeroVideoRef, HeroVideoProps>(
  ({ hlsSrc, mp4Fallback, poster, className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<any>(null)
    const [isMuted, setIsMuted] = useState(true)
    const [videoReady, setVideoReady] = useState(false)

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

      const handleCanPlay = () => {
        setVideoReady(true)
      }

      video.addEventListener('canplay', handleCanPlay)

      // Check if browser supports HLS natively (Safari, iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsSrc
        video.play().catch(() => {})
        return () => {
          video.removeEventListener('canplay', handleCanPlay)
        }
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
        video.removeEventListener('canplay', handleCanPlay)
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
      }
    }, [hlsSrc, mp4Fallback])

    return (
      <div className="relative w-full h-full">
        {/* Static poster image - renders immediately for fast LCP */}
        {!videoReady && (
          <img
            src={poster}
            alt=""
            width={640}
            height={360}
            className={`absolute inset-0 ${className}`}
            fetchPriority="high"
          />
        )}

        {/* Video - hidden until ready to avoid layout shift */}
        <video
          ref={videoRef}
          className={`${className} ${videoReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          // @ts-expect-error - fetchPriority is valid but not in React types yet
          fetchPriority="high"
        />
      </div>
    )
  }
)

HeroVideo.displayName = 'HeroVideo'
