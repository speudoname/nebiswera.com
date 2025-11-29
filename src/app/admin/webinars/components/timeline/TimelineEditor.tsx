'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Plus, Trash2, MessageSquare } from 'lucide-react'

interface Interaction {
  id: string
  type: string
  triggerTime: number
  title: string
  config: any
  pauseVideo: boolean
  enabled: boolean
}

interface ChatMessage {
  id: string
  senderName: string
  message: string
  appearsAt: number
  isFromModerator: boolean
}

interface TimelineEditorProps {
  webinarId: string
  videoUrl: string
  videoDuration: number // seconds
  interactions: Interaction[]
  chatMessages: ChatMessage[]
  onInteractionAdd: (triggerTime: number) => void
  onInteractionUpdate: (id: string, triggerTime: number) => void
  onInteractionDelete: (id: string) => void
  onInteractionClick: (interaction: Interaction) => void
}

export function TimelineEditor({
  webinarId,
  videoUrl,
  videoDuration,
  interactions,
  chatMessages,
  onInteractionAdd,
  onInteractionUpdate,
  onInteractionDelete,
  onInteractionClick,
}: TimelineEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1) // 1 = fit to container, 2 = 2x zoom, etc.

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Update current time as video plays
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

  // Toggle play/pause
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  // Seek to specific time
  const seekTo = (time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }

  // Handle timeline click to seek or add interaction
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return // Don't add interaction while dragging

    const timeline = timelineRef.current
    if (!timeline) return

    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = Math.max(0, Math.min(videoDuration, percentage * videoDuration))

    // If Shift key is pressed, add interaction
    if (e.shiftKey) {
      onInteractionAdd(Math.floor(time))
    } else {
      // Otherwise, seek to that time
      seekTo(time)
    }
  }

  // Handle interaction drag start
  const handleDragStart = (e: React.MouseEvent, interactionId: string) => {
    e.stopPropagation()
    setIsDragging(interactionId)
  }

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = Math.floor(percentage * videoDuration)

      onInteractionUpdate(isDragging, newTime)
    },
    [isDragging, videoDuration, onInteractionUpdate]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Add drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)

      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="bg-neu-light rounded-xl shadow-neu p-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onLoadedMetadata={() => {
              // Video loaded
            }}
          />

          {/* Play/Pause Overlay */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="w-16 h-16 text-white" />
            ) : (
              <Play className="w-16 h-16 text-white" />
            )}
          </button>

          {/* Time display */}
          <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <div className="text-sm text-text-secondary">
            Hold Shift + Click timeline to add interaction
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-neu-light rounded-xl shadow-neu p-4">
        <div className="space-y-3">
          {/* Zoom Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Timeline</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Zoom:</span>
              <button
                onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                className="px-2 py-1 rounded bg-neu-light shadow-neu-inset text-sm"
              >
                -
              </button>
              <span className="text-sm font-medium w-12 text-center">{zoom}x</span>
              <button
                onClick={() => setZoom(Math.min(4, zoom + 0.5))}
                className="px-2 py-1 rounded bg-neu-light shadow-neu-inset text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Timeline Track */}
          <div className="relative">
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              className="relative h-24 bg-neu-dark rounded-lg cursor-crosshair overflow-hidden"
              style={{ width: `${zoom * 100}%` }}
            >
              {/* Time markers */}
              <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-text-secondary px-2 py-1">
                {Array.from({ length: Math.ceil(videoDuration / 60) + 1 }).map((_, i) => {
                  const seconds = i * 60
                  if (seconds > videoDuration) return null
                  return (
                    <span key={i} className="text-xs">
                      {formatTime(seconds)}
                    </span>
                  )
                })}
              </div>

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary-500 z-30"
                style={{ left: `${(currentTime / videoDuration) * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full" />
              </div>

              {/* Chat messages (bottom track) */}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="absolute bottom-2 w-1 h-6 bg-blue-400 rounded-full z-10"
                  style={{ left: `${(msg.appearsAt / videoDuration) * 100}%` }}
                  title={`${msg.senderName}: ${msg.message}`}
                >
                  <MessageSquare className="w-3 h-3 text-blue-500 absolute -top-1 left-1/2 -translate-x-1/2" />
                </div>
              ))}

              {/* Interaction markers */}
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className={`absolute top-8 w-8 h-8 rounded-lg z-20 cursor-move transition-all ${
                    isDragging === interaction.id
                      ? 'scale-125 shadow-lg'
                      : 'hover:scale-110'
                  } ${
                    interaction.enabled
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-400 text-gray-200'
                  }`}
                  style={{ left: `calc(${(interaction.triggerTime / videoDuration) * 100}% - 16px)` }}
                  onMouseDown={(e) => handleDragStart(e, interaction.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onInteractionClick(interaction)
                  }}
                  title={interaction.title}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {interaction.type.charAt(0)}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onInteractionDelete(interaction.id)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary-500 rounded" />
              <span>Interactions</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Chat Messages</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-primary-500" />
              <span>Current Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
