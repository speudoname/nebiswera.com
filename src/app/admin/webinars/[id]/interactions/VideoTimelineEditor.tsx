'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  SkipBack,
  SkipForward,
  Plus,
  Edit2,
  Trash2,
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
  onInteractionClick: (interaction: Interaction) => void
  onInteractionMove: (id: string, newTime: number) => void
  onAddInteraction: (time: number) => void
  onDeleteInteraction: (id: string) => void
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

const INTERACTION_COLORS: Record<string, string> = {
  POLL: 'bg-blue-500',
  QUIZ: 'bg-purple-500',
  CTA: 'bg-green-500',
  DOWNLOAD: 'bg-orange-500',
  QUESTION: 'bg-pink-500',
  FEEDBACK: 'bg-yellow-500',
  CONTACT_FORM: 'bg-indigo-500',
  TIP: 'bg-teal-500',
  SPECIAL_OFFER: 'bg-red-500',
  PAUSE: 'bg-gray-500',
}

export function VideoTimelineEditor({
  videoUrl,
  videoDuration,
  interactions,
  onInteractionClick,
  onInteractionMove,
  onAddInteraction,
  onDeleteInteraction,
}: VideoTimelineEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [zoom, setZoom] = useState(1) // 1x = full timeline, 2x = zoomed in 2x
  const [timelineScroll, setTimelineScroll] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }

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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const time = (percent * videoDuration) / zoom + timelineScroll

    if (e.shiftKey) {
      // Shift+click to add interaction
      onAddInteraction(time)
    } else {
      // Regular click to seek
      seekTo(time)
    }
  }

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const time = (percent * videoDuration) / zoom + timelineScroll
    setHoveredTime(time)
  }

  const handleMarkerDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDraggingId(id)
  }

  const handleMarkerDrag = (e: React.MouseEvent) => {
    if (!draggingId || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const time = (percent * videoDuration) / zoom + timelineScroll

    onInteractionMove(draggingId, time)
  }

  const handleMarkerDragEnd = () => {
    setDraggingId(null)
  }

  const zoomIn = () => setZoom(Math.min(10, zoom * 1.5))
  const zoomOut = () => setZoom(Math.max(1, zoom / 1.5))

  const getMarkerPosition = (time: number) => {
    const adjustedTime = time - timelineScroll
    const percent = (adjustedTime / videoDuration) * zoom * 100
    return `${Math.max(0, Math.min(100, percent))}%`
  }

  const isMarkerVisible = (time: number) => {
    const visibleStart = timelineScroll
    const visibleEnd = timelineScroll + videoDuration / zoom
    return time >= visibleStart && time <= visibleEnd
  }

  // Calculate visible time range
  const visibleStart = timelineScroll
  const visibleEnd = timelineScroll + videoDuration / zoom
  const visibleDuration = visibleEnd - visibleStart

  // Generate time markers for the timeline
  const getTimeMarkers = () => {
    const markerInterval = visibleDuration > 300 ? 60 : visibleDuration > 60 ? 30 : visibleDuration > 30 ? 10 : 5
    const markers = []
    let time = Math.floor(visibleStart / markerInterval) * markerInterval

    while (time <= visibleEnd) {
      if (time >= 0) {
        markers.push(time)
      }
      time += markerInterval
    }

    return markers
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <Card variant="raised" padding="none">
        <div className="bg-black aspect-video relative">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            preload="metadata"
          />

          {/* Play/Pause Overlay */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="w-20 h-20 text-white" />
            ) : (
              <Play className="w-20 h-20 text-white" />
            )}
          </button>

          {/* Current Time Display */}
          <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </div>
        </div>
      </Card>

      {/* Timeline Controls */}
      <Card variant="raised" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => seekTo(currentTime - 5)}
              className="p-2 hover:bg-neu-dark rounded transition-colors"
              title="Rewind 5s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 hover:bg-neu-dark rounded transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => seekTo(currentTime + 5)}
              className="p-2 hover:bg-neu-dark rounded transition-colors"
              title="Forward 5s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Zoom: {zoom.toFixed(1)}x</span>
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-neu-dark rounded transition-colors"
              disabled={zoom <= 1}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-neu-dark rounded transition-colors"
              disabled={zoom >= 10}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Click timeline to seek • Shift+Click to add interaction • Drag markers to reposition
          </p>

          <div
            ref={timelineRef}
            className="relative h-24 bg-neu-dark rounded-lg cursor-crosshair select-none"
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={() => setHoveredTime(null)}
          >
            {/* Time markers */}
            <div className="absolute inset-x-0 top-0 h-6 flex items-end">
              {getTimeMarkers().map((time) => {
                const position = getMarkerPosition(time)
                return (
                  <div
                    key={time}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: position }}
                  >
                    <div className="w-px h-2 bg-text-muted" />
                    <span className="text-xs text-text-muted mt-1 whitespace-nowrap">
                      {formatTime(time)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Interaction markers */}
            <div
              className="absolute inset-0"
              onMouseMove={draggingId ? handleMarkerDrag : undefined}
              onMouseUp={handleMarkerDragEnd}
              onMouseLeave={handleMarkerDragEnd}
            >
              {interactions.filter(i => isMarkerVisible(i.triggerTime)).map((interaction) => {
                const Icon = INTERACTION_ICONS[interaction.type] || BarChart2
                const color = INTERACTION_COLORS[interaction.type] || 'bg-gray-500'
                const position = getMarkerPosition(interaction.triggerTime)

                return (
                  <div
                    key={interaction.id}
                    className="absolute top-8 transform -translate-x-1/2 group"
                    style={{ left: position }}
                    onMouseDown={(e) => handleMarkerDragStart(e, interaction.id)}
                  >
                    {/* Vertical line */}
                    <div className={`w-0.5 h-16 ${color} opacity-50`} />

                    {/* Marker */}
                    <div
                      className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white shadow-lg cursor-move ${
                        draggingId === interaction.id ? 'scale-125' : ''
                      } ${!interaction.enabled ? 'opacity-50' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                        {interaction.title}
                        <div className="text-gray-300">{formatTime(interaction.triggerTime)}</div>
                      </div>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onInteractionClick(interaction)
                        }}
                        className="p-1 bg-white rounded shadow-lg hover:bg-gray-100"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteInteraction(interaction.id)
                        }}
                        className="p-1 bg-white rounded shadow-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Playhead */}
            {currentTime >= visibleStart && currentTime <= visibleEnd && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary-500 pointer-events-none z-20"
                style={{ left: getMarkerPosition(currentTime) }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-primary-500 rounded-full" />
              </div>
            )}

            {/* Hover time indicator */}
            {hoveredTime !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
                style={{ left: getMarkerPosition(hoveredTime) }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
                  {formatTime(hoveredTime)}
                </div>
              </div>
            )}
          </div>

          {/* Zoom scrollbar (when zoomed) */}
          {zoom > 1 && (
            <input
              type="range"
              min={0}
              max={videoDuration - videoDuration / zoom}
              step={1}
              value={timelineScroll}
              onChange={(e) => setTimelineScroll(parseFloat(e.target.value))}
              className="w-full"
            />
          )}
        </div>
      </Card>
    </div>
  )
}
