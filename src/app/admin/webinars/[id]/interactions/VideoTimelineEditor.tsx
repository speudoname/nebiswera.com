'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Z_INDEX } from './constants'
import { formatTime } from './utils'
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  SkipBack,
  SkipForward,
  X,
  BarChart2,
  MousePointer,
  Download,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Gift,
  HelpCircle,
  UserPlus,
  Pause as PauseIcon,
  Plus,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface Interaction {
  id: string
  type: string
  triggerTime: number
  title: string
  enabled: boolean
}

interface VideoTimelineEditorProps {
  videoUrl: string
  videoDuration: number
  interactions: Interaction[]
  onCurrentTimeChange?: (time: number) => void
  highlightedInteractionId: string | null
  onInteractionHover: (id: string | null) => void
  onInteractionClick: (interaction: Interaction) => void
  onInteractionMove: (id: string, newTime: number) => void
  onAddInteraction: (time: number) => void
  onDeleteInteraction: (id: string) => void
}

const INTERACTION_COLORS: Record<string, string> = {
  POLL: '#3B82F6',
  QUIZ: '#A855F7',
  CTA: '#10B981',
  DOWNLOAD: '#F97316',
  QUESTION: '#EC4899',
  FEEDBACK: '#EAB308',
  CONTACT_FORM: '#6366F1',
  TIP: '#14B8A6',
  SPECIAL_OFFER: '#EF4444',
  PAUSE: '#6B7280',
}

const INTERACTION_ICONS: Record<string, any> = {
  POLL: BarChart2,
  QUIZ: HelpCircle,
  CTA: MousePointer,
  DOWNLOAD: Download,
  QUESTION: MessageSquare,
  FEEDBACK: ThumbsUp,
  CONTACT_FORM: UserPlus,
  TIP: Lightbulb,
  SPECIAL_OFFER: Gift,
  PAUSE: PauseIcon,
}

export function VideoTimelineEditor({
  videoUrl,
  videoDuration,
  interactions,
  onCurrentTimeChange,
  highlightedInteractionId,
  onInteractionHover,
  onInteractionClick,
  onInteractionMove,
  onAddInteraction,
  onDeleteInteraction,
}: VideoTimelineEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [viewportStart, setViewportStart] = useState(0) // Start time of visible viewport
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate viewport duration based on zoom
  const viewportDuration = videoDuration / zoom
  const viewportEnd = viewportStart + viewportDuration

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)
      onCurrentTimeChange?.(time)

      // Auto-scroll viewport to follow playhead
      if (time < viewportStart || time > viewportEnd) {
        const newStart = Math.max(0, time - viewportDuration / 2)
        setViewportStart(Math.min(newStart, videoDuration - viewportDuration))
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedData = () => {
      setIsLoading(false)
      setVideoError(null)
    }
    const handleError = () => {
      setIsLoading(false)
      setVideoError('Failed to load video. Please check the video URL.')
    }
    const handleLoadStart = () => {
      setIsLoading(true)
      setVideoError(null)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
    }
  }, [viewportStart, viewportEnd, viewportDuration, videoDuration])

  const togglePlayPause = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const seekTo = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, Math.min(videoDuration, time))
  }

  // Keyboard shortcuts for video player
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break

        case 'ArrowLeft':
          e.preventDefault()
          seekTo(currentTime - 5)
          break

        case 'ArrowRight':
          e.preventDefault()
          seekTo(currentTime + 5)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentTime])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || draggingId) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const time = viewportStart + percent * viewportDuration

    seekTo(time)
  }

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const time = viewportStart + percent * viewportDuration
    setHoveredTime(time)
  }

  const handleMarkerMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDraggingId(id)
  }

  const handleMarkerDrag = (e: React.MouseEvent) => {
    if (!draggingId || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const time = viewportStart + percent * viewportDuration

    onInteractionMove(draggingId, Math.max(0, Math.min(videoDuration, time)))
  }

  const handleMarkerDragEnd = () => {
    setDraggingId(null)
  }

  const handleMarkerDoubleClick = (interaction: Interaction) => {
    onInteractionClick(interaction)
  }

  const zoomIn = () => {
    const newZoom = Math.min(20, zoom * 1.5)
    const newViewportDuration = videoDuration / newZoom
    // Center zoom around current time
    const newStart = Math.max(
      0,
      Math.min(
        currentTime - newViewportDuration / 2,
        videoDuration - newViewportDuration
      )
    )
    setZoom(newZoom)
    setViewportStart(newStart)
  }

  const zoomOut = () => {
    const newZoom = Math.max(1, zoom / 1.5)
    setZoom(newZoom)
    if (newZoom === 1) {
      setViewportStart(0)
    }
  }

  const getTimePosition = (time: number) => {
    const percent = ((time - viewportStart) / viewportDuration) * 100
    return `${Math.max(0, Math.min(100, percent))}%`
  }

  const isTimeVisible = (time: number) => {
    return time >= viewportStart && time <= viewportEnd
  }

  // Smart timecode generation based on zoom level
  const getTimeMarkers = () => {
    // Determine interval based on viewport duration
    let interval: number
    if (viewportDuration > 3600) {
      interval = 600 // 10 min
    } else if (viewportDuration > 1800) {
      interval = 300 // 5 min
    } else if (viewportDuration > 600) {
      interval = 120 // 2 min
    } else if (viewportDuration > 300) {
      interval = 60 // 1 min
    } else if (viewportDuration > 120) {
      interval = 30 // 30 sec
    } else if (viewportDuration > 60) {
      interval = 15 // 15 sec
    } else if (viewportDuration > 30) {
      interval = 10 // 10 sec
    } else {
      interval = 5 // 5 sec
    }

    const markers = []
    let time = Math.floor(viewportStart / interval) * interval

    while (time <= viewportEnd) {
      if (time >= 0 && time <= videoDuration) {
        markers.push(time)
      }
      time += interval
    }

    return markers
  }

  // Minimap viewport indicator
  const minimapViewportLeft = (viewportStart / videoDuration) * 100
  const minimapViewportWidth = (viewportDuration / videoDuration) * 100

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const clickedTime = percent * videoDuration

    // Center viewport around clicked position
    const newStart = Math.max(
      0,
      Math.min(clickedTime - viewportDuration / 2, videoDuration - viewportDuration)
    )
    setViewportStart(newStart)
    seekTo(clickedTime)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Video Player - Dynamic height */}
      <div className="bg-black relative mb-1 flex-1 min-h-0">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          preload="metadata"
        />

        {/* Loading State */}
        {isLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-white font-medium">Video Error</p>
              <p className="text-gray-300 text-sm">{videoError}</p>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.load()
                  }
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Play/Pause Overlay */}
        {!isLoading && !videoError && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                <Pause className="w-8 h-8 text-white" fill="white" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            )}
          </button>
        )}

        {/* Time Display */}
        <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
          {formatTime(currentTime, true)} / {formatTime(videoDuration)}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between mb-1 px-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => seekTo(currentTime - 5)}
            className="p-1 hover:bg-neu-dark rounded transition-colors"
            title="Back 5s"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => seekTo(currentTime + 5)}
            className="p-1 hover:bg-neu-dark rounded transition-colors"
            title="Forward 5s"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-secondary font-medium">
            Zoom: {zoom.toFixed(1)}x
          </span>
          <button
            onClick={zoomOut}
            className="p-1 hover:bg-neu-dark rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={zoom <= 1}
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomIn}
            className="p-1 hover:bg-neu-dark rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={zoom >= 20}
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className={`flex-shrink-0 relative ${Z_INDEX.TIMELINE_CONTAINER}`}>
        <div className="text-[9px] text-text-secondary mb-0.5 px-1">
          Click to seek • Drag markers • Double-click to edit
        </div>

        <div
          ref={timelineRef}
          className="relative h-16 bg-neu-light rounded cursor-pointer select-none border border-neu-dark px-2 overflow-visible"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={() => setHoveredTime(null)}
        >
          {/* Time markers */}
          <div className="absolute inset-x-2 top-0 h-8 pointer-events-none">
            {getTimeMarkers().map((time) => {
              const position = getTimePosition(time)
              const positionPercent = ((time - viewportStart) / viewportDuration) * 100

              // Skip markers too close to edges to prevent cutoff
              if (positionPercent < 3 || positionPercent > 97) return null

              return (
                <div
                  key={time}
                  className="absolute flex flex-col items-center"
                  style={{ left: position, transform: 'translateX(-50%)' }}
                >
                  <div className="w-px h-3 bg-text-muted" />
                  <span className="text-[10px] text-text-secondary mt-0.5 font-mono whitespace-nowrap">
                    {formatTime(time)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Interaction markers */}
          <div
            className="absolute inset-0 top-10"
            onMouseMove={draggingId ? handleMarkerDrag : undefined}
            onMouseUp={handleMarkerDragEnd}
            onMouseLeave={handleMarkerDragEnd}
          >
            {interactions.filter(i => isTimeVisible(i.triggerTime)).map((interaction) => {
              const position = getTimePosition(interaction.triggerTime)
              const color = INTERACTION_COLORS[interaction.type] || '#6B7280'
              const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare
              const isHighlighted = highlightedInteractionId === interaction.id

              return (
                <div
                  key={interaction.id}
                  className="absolute top-0 bottom-0 group cursor-move"
                  style={{ left: position, transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => handleMarkerMouseDown(e, interaction.id)}
                  onMouseEnter={() => onInteractionHover(interaction.id)}
                  onMouseLeave={() => onInteractionHover(null)}
                  onDoubleClick={() => handleMarkerDoubleClick(interaction)}
                >
                  {/* Vertical line */}
                  <div
                    className={`w-0.5 h-full transition-opacity ${
                      isHighlighted ? 'opacity-80' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: color }}
                  />

                  {/* Marker circle with icon */}
                  <div
                    className={`absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 shadow-lg transition-all flex items-center justify-center ${
                      draggingId === interaction.id ? 'scale-125 z-50' :
                      isHighlighted ? 'scale-125 z-40 border-white' :
                      'group-hover:scale-110 z-10 border-white'
                    } ${!interaction.enabled ? 'opacity-50' : ''}`}
                    style={{
                      backgroundColor: color,
                      boxShadow: isHighlighted ? `0 0 0 4px ${color}40` : undefined
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>

                  {/* Tooltip */}
                  <div className={`absolute -bottom-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${Z_INDEX.TOOLTIP}`}>
                    <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-xl">
                      <div className="font-medium">{interaction.title}</div>
                      <div className="text-gray-300 text-[10px]">
                        {formatTime(interaction.triggerTime)} • {interaction.type}
                      </div>
                      <div className="text-gray-400 text-[10px] mt-0.5">
                        Double-click to edit
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Playhead */}
          {isTimeVisible(currentTime) && (
            <>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary-500 pointer-events-none z-30"
                style={{ left: getTimePosition(currentTime) }}
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
              </div>

              {/* Add Interaction Button at Playhead */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddInteraction(Math.floor(currentTime))
                }}
                className={`absolute -top-11 transform -translate-x-1/2 pointer-events-auto ${Z_INDEX.TIMELINE_MARKERS} group/add`}
                style={{ left: getTimePosition(currentTime) }}
                title="Add interaction at current time"
              >
                <div className="w-8 h-8 bg-primary-500 hover:bg-primary-600 rounded-full shadow-xl flex items-center justify-center transition-all group-hover/add:scale-110 border-2 border-white">
                  <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 opacity-0 group-hover/add:opacity-100 transition-opacity pointer-events-none ${Z_INDEX.TOOLTIP}`}>
                  <div className="bg-gray-900 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-lg">
                    Add at {formatTime(currentTime)}
                  </div>
                </div>
              </button>
            </>
          )}

          {/* Hover indicator */}
          {hoveredTime !== null && !draggingId && (
            <div
              className="absolute top-0 bottom-0 w-px bg-gray-400 pointer-events-none z-20"
              style={{ left: getTimePosition(hoveredTime) }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap font-mono">
                {formatTime(hoveredTime, true)}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Minimap - Always visible at bottom */}
      <div className="mt-2 px-1 pb-3 flex-shrink-0">
        <div className="text-[10px] text-text-secondary mb-1">Overview</div>
        <div
          className="relative h-5 bg-neu-dark rounded cursor-pointer"
          onClick={handleMinimapClick}
        >
          {/* All interactions on minimap */}
          {interactions.map((interaction) => {
            const position = (interaction.triggerTime / videoDuration) * 100
            const color = INTERACTION_COLORS[interaction.type] || '#6B7280'
            return (
              <div
                key={interaction.id}
                className="absolute top-0 bottom-0 w-0.5 opacity-60"
                style={{ left: `${position}%`, backgroundColor: color }}
              />
            )
          })}

          {/* Viewport indicator - only show when zoomed */}
          {zoom > 1 && (
            <div
              className="absolute top-0 bottom-0 bg-primary-500/30 border-x-2 border-primary-500"
              style={{
                left: `${minimapViewportLeft}%`,
                width: `${minimapViewportWidth}%`,
              }}
            />
          )}

          {/* Playhead on minimap */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary-600 z-10"
            style={{ left: `${(currentTime / videoDuration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
