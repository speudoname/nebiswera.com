'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

const HERO_VIDEO = {
  hls: 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/playlist.m3u8',
  mp4: 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/play_720p.mp4',
  poster: 'https://cdn.nebiswera.com/hero/video-poster.jpg',
}

interface HeroVideoPlayerProps {
  locale: string
}

/**
 * Hero Video Player - Client Component
 *
 * This component overlays on top of the server-rendered poster image.
 * It only shows the video once it's ready to play, creating a seamless
 * transition from static image to video.
 */
export function HeroVideoPlayer({ locale }: HeroVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [showButton, setShowButton] = useState(true)
  const [hasUnmuted, setHasUnmuted] = useState(false)

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
      video.src = HERO_VIDEO.hls
      video.play().catch(() => {})
      return () => {
        video.removeEventListener('canplay', handleCanPlay)
      }
    }

    // Dynamically import hls.js for other browsers
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        // HLS not supported, fall back to MP4
        video.src = HERO_VIDEO.mp4
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
        hls.loadSource(HERO_VIDEO.hls)
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          console.error('HLS error, falling back to MP4:', data.type)
          hls.destroy()
          hlsRef.current = null
          video.src = HERO_VIDEO.mp4
          video.play().catch(() => {})
        }
      })
    }).catch(() => {
      // Failed to load hls.js, use MP4
      video.src = HERO_VIDEO.mp4
      video.play().catch(() => {})
    })

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  function toggleMute() {
    const video = videoRef.current
    if (video) {
      const newMuted = !video.muted
      video.muted = newMuted
      setIsMuted(newMuted)

      // If unmuting for the first time, hide the button
      if (!newMuted && !hasUnmuted) {
        setHasUnmuted(true)
        setShowButton(false)
      }
    }
  }

  function handleVideoClick() {
    // After first unmute, clicking video toggles button visibility
    if (hasUnmuted) {
      setShowButton(!showButton)
    }
  }

  return (
    <>
      {/* Video - hidden until ready, overlays the server-rendered poster */}
      <video
        ref={videoRef}
        onClick={handleVideoClick}
        className={`absolute inset-0 w-full h-full object-cover cursor-pointer ${
          videoReady ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
        poster={HERO_VIDEO.poster}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Unmute Button */}
      {showButton && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleMute()
          }}
          className={`absolute transition-all z-10 ${
            !hasUnmuted
              ? 'top-6 right-6 bg-primary-500 text-white px-6 py-4 rounded-neu shadow-neu-md hover:shadow-neu-lg hover:bg-primary-600 active:shadow-neu-pressed'
              : 'top-4 right-4 bg-neu-base/90 backdrop-blur-sm text-text-primary rounded-full p-3 shadow-neu hover:shadow-neu-hover active:shadow-neu-pressed'
          }`}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {!hasUnmuted ? (
            <div className="flex items-center gap-2">
              <VolumeX className="w-6 h-6" />
              <span className="font-semibold text-sm">
                {locale === 'ka' ? 'ხმის ჩართვა' : 'Click for Sound'}
              </span>
            </div>
          ) : isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      )}
    </>
  )
}
