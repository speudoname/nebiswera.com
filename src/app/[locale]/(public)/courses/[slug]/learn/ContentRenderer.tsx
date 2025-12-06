'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, ExternalLink, FileText, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'
import type {
  ContentBlock,
  TextContentBlock,
  VideoContentBlock,
  AudioContentBlock,
  HtmlContentBlock,
  ImageContentBlock,
  FileContentBlock,
  EmbedContentBlock,
  QuizContentBlock,
} from '@/lib/lms/types'
import { QuizPlayer } from './QuizPlayer'

interface ContentRendererProps {
  block: ContentBlock
  courseSlug: string
  partId: string
  locale: string
  onVideoProgress?: (watchTime: number, duration: number, percent: number) => void
  onQuizComplete?: (passed: boolean) => void
  onQuizPixelTrack?: (quizId: string, quizTitle: string, passed: boolean, score: number) => void
}

export function ContentRenderer({
  block,
  courseSlug,
  partId,
  locale,
  onVideoProgress,
  onQuizComplete,
  onQuizPixelTrack,
}: ContentRendererProps) {
  switch (block.type) {
    case 'text':
      return <TextRenderer block={block} />
    case 'video':
      return <VideoRenderer block={block} onProgress={onVideoProgress} />
    case 'audio':
      return <AudioRenderer block={block} />
    case 'html':
      return <HtmlRenderer block={block} />
    case 'image':
      return <ImageRenderer block={block} />
    case 'file':
      return <FileRenderer block={block} />
    case 'embed':
      return <EmbedRenderer block={block} />
    case 'quiz':
      return (
        <QuizPlayer
          quizId={block.quizId}
          courseSlug={courseSlug}
          partId={partId}
          isGate={block.isGate}
          onComplete={onQuizComplete}
          onPixelTrack={onQuizPixelTrack}
          locale={locale}
        />
      )
    default:
      return null
  }
}

// Text Block - Renders markdown/rich text
function TextRenderer({ block }: { block: TextContentBlock }) {
  return (
    <div
      className="prose prose-lg max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-primary-600 prose-strong:text-text-primary"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
    />
  )
}

// Video Block - HLS Video Player with progress tracking
function VideoRenderer({
  block,
  onProgress,
}: {
  block: VideoContentBlock
  onProgress?: (watchTime: number, duration: number, percent: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(block.duration || 0)
  const [isMuted, setIsMuted] = useState(false)
  const lastProgressRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Load HLS if available
    const loadHls = async () => {
      if (block.url.includes('.m3u8')) {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.loadSource(block.url)
          hls.attachMedia(video)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = block.url
        }
      } else {
        video.src = block.url
      }
    }

    loadHls()

    // Event listeners
    const handleTimeUpdate = () => {
      const time = video.currentTime
      const dur = video.duration || block.duration || 0
      setCurrentTime(time)
      setDuration(dur)

      // Report progress every 5 seconds
      if (dur > 0 && time - lastProgressRef.current >= 5) {
        lastProgressRef.current = time
        const percent = Math.round((time / dur) * 100)
        onProgress?.(time, dur, percent)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      const dur = video.duration || block.duration || 0
      onProgress?.(dur, dur, 100)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [block.url, block.duration, onProgress])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(!isMuted)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={block.thumbnail}
          playsInline
        />

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer mb-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              <span className="text-sm text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Audio Block - Audio Player
function AudioRenderer({ block }: { block: AudioContentBlock }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(block.duration || 0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration || block.duration || 0)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [block.duration])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-100 rounded-xl p-4">
      <audio ref={audioRef} src={block.url} preload="metadata" />

      {block.title && (
        <h4 className="font-medium text-text-primary mb-3">{block.title}</h4>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:rounded-full"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// HTML Block - Sanitized HTML content
function HtmlRenderer({ block }: { block: HtmlContentBlock }) {
  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
    />
  )
}

// Image Block - Single image with caption
function ImageRenderer({ block }: { block: ImageContentBlock }) {
  return (
    <figure className="my-6">
      <div className="relative rounded-xl overflow-hidden">
        <Image
          src={block.url}
          alt={block.alt || ''}
          width={block.width || 800}
          height={block.height || 600}
          className="w-full h-auto"
        />
      </div>
      {block.caption && (
        <figcaption className="text-center text-sm text-text-secondary mt-2">
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

// File Block - Downloadable file
function FileRenderer({ block }: { block: FileContentBlock }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <a
      href={block.url}
      download={block.filename}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
    >
      <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
        <FileText className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary truncate">{block.filename}</div>
        <div className="text-sm text-text-secondary">{formatSize(block.size)}</div>
      </div>
      <Download className="w-5 h-5 text-text-secondary" />
    </a>
  )
}

// Embed Block - YouTube, Vimeo, or custom embed
function EmbedRenderer({ block }: { block: EmbedContentBlock }) {
  let embedUrl = block.embedUrl

  // Convert YouTube URLs to embed format
  if (block.provider === 'youtube') {
    const videoId = extractYouTubeId(block.embedUrl)
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    }
  }

  // Convert Vimeo URLs to embed format
  if (block.provider === 'vimeo') {
    const videoId = extractVimeoId(block.embedUrl)
    if (videoId) {
      embedUrl = `https://player.vimeo.com/video/${videoId}`
    }
  }

  const aspectRatio = block.aspectRatio || '16:9'
  const [w, h] = aspectRatio.split(':').map(Number)
  const paddingBottom = `${(h / w) * 100}%`

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <div className="relative" style={{ paddingBottom }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={block.title || 'Embedded video'}
        />
      </div>
    </div>
  )
}


// Helper functions
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /^(\d+)$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}
