'use client'

import { useRef, useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

const HERO_VIDEO = {
  videoId: '973721e6-63ae-4773-877f-021b677f08f7',
  hlsUrl: 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/playlist.m3u8',
  mp4Url: 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/play_720p.mp4',
  poster: 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/thumbnail_8f42b11e.jpg',
}

interface HeroVideoPlayerProps {
  locale: string
}

/**
 * Hero video player with HLS streaming and custom unmute button
 * Uses HLS for instant playback, falls back to MP4
 */
export function HeroVideoPlayer({ locale }: HeroVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HERO_VIDEO.hlsUrl
      return
    }

    // Dynamically import hls.js for other browsers
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        // HLS not supported, fall back to MP4
        video.src = HERO_VIDEO.mp4Url
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
        hls.loadSource(HERO_VIDEO.hlsUrl)
      })

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          console.error('HLS error, falling back to MP4:', data)
          hls.destroy()
          hlsRef.current = null
          video.src = HERO_VIDEO.mp4Url
        }
      })
    }).catch(() => {
      // Failed to load hls.js, use MP4
      video.src = HERO_VIDEO.mp4Url
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  function toggleMute() {
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
      setIsMuted(!video.muted)
    }
  }

  return (
    <>
      {/* HLS video with instant streaming */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        width={1280}
        height={720}
        poster={HERO_VIDEO.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        {/* Fallback for browsers without HLS support */}
        <source src={HERO_VIDEO.mp4Url} type="video/mp4" />
      </video>

      {/* Unmute button - compact design */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 md:top-6 md:right-6 bg-primary-500 text-white rounded-neu shadow-neu-md hover:shadow-neu-lg hover:bg-primary-600 active:shadow-neu-pressed transition-all z-10 p-3 md:px-6 md:py-4"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
          {isMuted ? (
            <>
              <VolumeX className="w-6 h-6 md:w-6 md:h-6" />
              <span className="font-medium text-[10px] md:text-sm leading-tight md:leading-normal">
                {locale === 'ka' ? 'ხმის ჩართვა' : 'Turn on sound'}
              </span>
            </>
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </div>
      </button>
    </>
  )
}
