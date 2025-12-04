'use client'

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  TrendingDown,
  MessageSquare,
  MousePointer,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Video,
  X,
  Maximize,
  Minimize,
} from 'lucide-react'
import Hls from 'hls.js'

interface TimeSegment {
  startSecond: number
  endSecond: number
  viewerCount: number
  dropoffCount: number
  dropoffRate: number
}

interface ChatMessage {
  minute: number
  count: number
}

interface Interaction {
  id: string
  type: string
  title: string
  triggerTime: number
  viewCount: number
  actionCount: number
  engagementRate: number
}

interface VideoTimelineProps {
  segments: TimeSegment[]
  chatMessages: ChatMessage[]
  interactions: Interaction[]
  videoDuration: number
  videoThumbnailUrl?: string
  videoHlsUrl?: string
  avgSessionDuration: number
  peakViewers: { time: number; count: number }
  criticalDropoffs: Array<{ time: number; dropoffRate: number }>
}

export function VideoTimelineAnalytics({
  segments,
  chatMessages,
  interactions,
  videoDuration,
  videoHlsUrl,
  avgSessionDuration,
  peakViewers,
  criticalDropoffs,
}: VideoTimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [activeLayer, setActiveLayer] = useState<'all' | 'viewers' | 'dropoff' | 'chat' | 'interactions'>('all')
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const [isVideoExpanded, setIsVideoExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Timeline height - taller for better scale visualization
  const TIMELINE_HEIGHT = 400

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const maxViewers = useMemo(
    () => Math.max(...segments.map((s) => s.viewerCount), 1),
    [segments]
  )

  const maxDropoff = useMemo(
    () => Math.max(...segments.map((s) => s.dropoffRate), 1),
    [segments]
  )

  const maxChat = useMemo(
    () => Math.max(...chatMessages.map((m) => m.count), 1),
    [chatMessages]
  )

  // Timeline width based on zoom
  const timelineWidth = useMemo(() => Math.max(100, zoomLevel * 100), [zoomLevel])

  // Get segment at a specific time
  const getSegmentAtTime = useCallback(
    (time: number) => segments.find((s) => time >= s.startSecond && time < s.endSecond),
    [segments]
  )

  // Get chat count at a specific minute
  const getChatAtMinute = useCallback(
    (minute: number) => chatMessages.find((m) => m.minute === minute)?.count || 0,
    [chatMessages]
  )

  // Get interactions at a specific time range
  const getInteractionsNear = useCallback(
    (time: number, range: number = 30) =>
      interactions.filter((i) => Math.abs(i.triggerTime - time) < range),
    [interactions]
  )

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z * 1.5, 10))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z / 1.5, 1))
  const handleReset = () => {
    setZoomLevel(1)
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const step = containerRef.current.clientWidth * 0.5
      containerRef.current.scrollBy({
        left: direction === 'left' ? -step : step,
        behavior: 'smooth',
      })
    }
  }

  // Handle timeline click to seek video
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * videoDuration
    setSelectedTime(time)

    if (videoHlsUrl) {
      setShowVideoPlayer(true)
    }
  }, [videoDuration, videoHlsUrl])

  // Initialize HLS video player
  useEffect(() => {
    if (!showVideoPlayer || !videoHlsUrl || !videoRef.current) return

    const video = videoRef.current

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })
      hlsRef.current = hls
      hls.loadSource(videoHlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (selectedTime !== null) {
          video.currentTime = selectedTime
        }
        video.muted = isMuted
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = videoHlsUrl
      video.addEventListener('loadedmetadata', () => {
        if (selectedTime !== null) {
          video.currentTime = selectedTime
        }
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [showVideoPlayer, videoHlsUrl, selectedTime, isMuted])

  // Update video time when playing
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [showVideoPlayer])

  // Seek video when selectedTime changes
  useEffect(() => {
    if (videoRef.current && selectedTime !== null && showVideoPlayer) {
      videoRef.current.currentTime = selectedTime
    }
  }, [selectedTime, showVideoPlayer])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const interval = videoDuration <= 300 ? 30 : videoDuration <= 900 ? 60 : videoDuration <= 3600 ? 300 : 600
    const markers = []
    for (let t = 0; t <= videoDuration; t += interval) {
      markers.push(t)
    }
    return markers
  }, [videoDuration])

  const getDropoffColor = (rate: number) => {
    if (rate > 30) return 'rgba(239, 68, 68, 0.8)' // red
    if (rate > 20) return 'rgba(249, 115, 22, 0.7)' // orange
    if (rate > 10) return 'rgba(234, 179, 8, 0.6)' // yellow
    return 'rgba(34, 197, 94, 0.5)' // green
  }

  // Tooltip data at hovered time
  const tooltipData = useMemo(() => {
    if (hoveredTime === null) return null
    const segment = getSegmentAtTime(hoveredTime)
    const chatCount = getChatAtMinute(Math.floor(hoveredTime / 60))
    const nearbyInteractions = getInteractionsNear(hoveredTime)
    return { segment, chatCount, nearbyInteractions }
  }, [hoveredTime, getSegmentAtTime, getChatAtMinute, getInteractionsNear])

  // Y-axis scale labels
  const yAxisLabels = useMemo(() => {
    const steps = 5
    const labels = []
    for (let i = 0; i <= steps; i++) {
      labels.push(Math.round((maxViewers / steps) * (steps - i)))
    }
    return labels
  }, [maxViewers])

  return (
    <Card variant="raised" padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-primary">Video Timeline Analytics</h3>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          {videoHlsUrl && !showVideoPlayer && (
            <button
              onClick={() => {
                setSelectedTime(0)
                setShowVideoPlayer(true)
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600"
            >
              <Video className="w-4 h-4" />
              Open Video
            </button>
          )}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-lg bg-neu-light shadow-neu-sm hover:shadow-neu-inset disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-text-secondary min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 10}
            className="p-2 rounded-lg bg-neu-light shadow-neu-sm hover:shadow-neu-inset disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-neu-light shadow-neu-sm hover:shadow-neu-inset"
            title="Reset view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-neu-light rounded-lg text-center">
          <p className="text-xl font-bold text-text-primary">{formatTime(avgSessionDuration)}</p>
          <p className="text-xs text-text-secondary">Avg Watch Time</p>
        </div>
        <div className="p-3 bg-neu-light rounded-lg text-center">
          <p className="text-xl font-bold text-primary-600">{peakViewers.count}</p>
          <p className="text-xs text-text-secondary">Peak Viewers at {formatTime(peakViewers.time)}</p>
        </div>
        <div className="p-3 bg-neu-light rounded-lg text-center">
          <p className="text-xl font-bold text-red-600">{criticalDropoffs.length}</p>
          <p className="text-xs text-text-secondary">Critical Drop-offs</p>
        </div>
        <div className="p-3 bg-neu-light rounded-lg text-center">
          <p className="text-xl font-bold text-blue-600">{interactions.length}</p>
          <p className="text-xs text-text-secondary">Interactions</p>
        </div>
      </div>

      {/* Layer Toggle */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-text-secondary">Show:</span>
        {[
          { key: 'all', label: 'All', icon: null },
          { key: 'viewers', label: 'Viewers', icon: Users },
          { key: 'dropoff', label: 'Drop-off', icon: TrendingDown },
          { key: 'chat', label: 'Chat', icon: MessageSquare },
          { key: 'interactions', label: 'Interactions', icon: MousePointer },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key as typeof activeLayer)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
              activeLayer === key
                ? 'bg-primary-500 text-white shadow-neu-sm'
                : 'bg-neu-light text-text-secondary hover:bg-neu-dark'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Timeline Container with Y-axis */}
      <div className="relative flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 text-xs text-text-secondary" style={{ height: TIMELINE_HEIGHT }}>
          {yAxisLabels.map((label, i) => (
            <span key={i} className="text-right w-8">{label}</span>
          ))}
        </div>

        {/* Timeline Container */}
        <div className="relative flex-1">
          {/* Scroll buttons */}
          {zoomLevel > 1 && (
            <>
              <button
                onClick={() => handleScroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/90 rounded-full shadow-lg hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/90 rounded-full shadow-lg hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Click hint */}
          {videoHlsUrl && (
            <div className="text-xs text-text-secondary mb-2 flex items-center gap-1">
              <Video className="w-3 h-3" />
              Click on the timeline to view video at that position
            </div>
          )}

          {/* Timeline Wrapper */}
          <div
            ref={containerRef}
            className="relative overflow-x-auto rounded-lg"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div
              className={`relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg overflow-hidden border border-slate-300 ${videoHlsUrl ? 'cursor-pointer' : ''}`}
              style={{ width: `${timelineWidth}%`, minWidth: '100%', height: TIMELINE_HEIGHT }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const time = (x / rect.width) * videoDuration
                setHoveredTime(time)
              }}
              onMouseLeave={() => setHoveredTime(null)}
              onClick={handleTimelineClick}
            >
              {/* Grid lines - horizontal */}
              <div className="absolute inset-0 pointer-events-none">
                {yAxisLabels.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 h-px bg-slate-300/50"
                    style={{ top: `${(i / (yAxisLabels.length - 1)) * 100}%` }}
                  />
                ))}
              </div>

              {/* Grid lines - vertical (time markers) */}
              <div className="absolute inset-0 pointer-events-none">
                {timeMarkers.map((t) => (
                  <div
                    key={t}
                    className="absolute top-0 bottom-0 w-px bg-slate-300/50"
                    style={{ left: `${(t / videoDuration) * 100}%` }}
                  />
                ))}
              </div>

              {/* Current video position indicator */}
              {showVideoPlayer && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary-500 z-20 pointer-events-none"
                  style={{ left: `${(currentVideoTime / videoDuration) * 100}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full" />
                </div>
              )}

              {/* Viewer retention area (blue gradient) */}
              {(activeLayer === 'all' || activeLayer === 'viewers') && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="viewerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0 ${TIMELINE_HEIGHT} ${segments
                      .map((s) => {
                        const x = (s.startSecond / videoDuration) * 100
                        const height = (s.viewerCount / maxViewers) * (TIMELINE_HEIGHT - 30)
                        return `L ${x}% ${TIMELINE_HEIGHT - height}`
                      })
                      .join(' ')} L 100% ${TIMELINE_HEIGHT} Z`}
                    fill="url(#viewerGradient)"
                  />
                  {/* Viewer line on top */}
                  <path
                    d={`M 0 ${TIMELINE_HEIGHT} ${segments
                      .map((s) => {
                        const x = (s.startSecond / videoDuration) * 100
                        const height = (s.viewerCount / maxViewers) * (TIMELINE_HEIGHT - 30)
                        return `L ${x}% ${TIMELINE_HEIGHT - height}`
                      })
                      .join(' ')}`}
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2"
                  />
                </svg>
              )}

              {/* Drop-off bars */}
              {(activeLayer === 'all' || activeLayer === 'dropoff') &&
                segments.map((segment, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 pointer-events-none"
                    style={{
                      left: `${(segment.startSecond / videoDuration) * 100}%`,
                      width: `${((segment.endSecond - segment.startSecond) / videoDuration) * 100}%`,
                      height: `${(segment.dropoffRate / maxDropoff) * 40}%`,
                      backgroundColor: getDropoffColor(segment.dropoffRate),
                    }}
                  />
                ))}

              {/* Chat activity dots */}
              {(activeLayer === 'all' || activeLayer === 'chat') &&
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="absolute transform -translate-x-1/2 pointer-events-none"
                    style={{
                      left: `${(msg.minute * 60 / videoDuration) * 100}%`,
                      bottom: `${5 + (msg.count / maxChat) * 20}%`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full bg-green-500 opacity-80"
                      style={{
                        transform: `scale(${1 + (msg.count / maxChat) * 1.5})`,
                      }}
                    />
                  </div>
                ))}

              {/* Interaction markers */}
              {(activeLayer === 'all' || activeLayer === 'interactions') &&
                interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="absolute top-2 transform -translate-x-1/2 group z-10"
                    style={{ left: `${(interaction.triggerTime / videoDuration) * 100}%` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTime(interaction.triggerTime)
                      if (videoHlsUrl) setShowVideoPlayer(true)
                    }}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-transform hover:scale-125 ${
                        interaction.type === 'POLL'
                          ? 'bg-purple-500'
                          : interaction.type === 'CTA'
                          ? 'bg-orange-500'
                          : interaction.type === 'QUIZ'
                          ? 'bg-blue-500'
                          : interaction.type === 'SPECIAL_OFFER'
                          ? 'bg-amber-500'
                          : interaction.type === 'TESTIMONIAL'
                          ? 'bg-teal-500'
                          : 'bg-gray-500'
                      }`}
                    >
                      {interaction.type[0]}
                    </div>
                    {/* Interaction tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                      <div className="font-semibold">{interaction.title}</div>
                      <div>{interaction.engagementRate}% engagement</div>
                    </div>
                  </div>
                ))}

              {/* Critical drop-off markers */}
              {criticalDropoffs.map((dropoff, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 w-1 bg-red-500 cursor-pointer hover:w-2 transition-all z-10"
                  style={{
                    left: `${(dropoff.time / videoDuration) * 100}%`,
                    height: '100%',
                    opacity: 0.7,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTime(dropoff.time)
                    if (videoHlsUrl) setShowVideoPlayer(true)
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              ))}

              {/* Hover cursor line */}
              {hoveredTime !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-600/50 pointer-events-none z-10"
                  style={{ left: `${(hoveredTime / videoDuration) * 100}%` }}
                />
              )}

              {/* Time labels at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-6 flex items-end pointer-events-none bg-gradient-to-t from-slate-200/80 to-transparent">
                {timeMarkers.map((t) => (
                  <div
                    key={t}
                    className="absolute text-[10px] text-slate-600 transform -translate-x-1/2"
                    style={{ left: `${(t / videoDuration) * 100}%` }}
                  >
                    {formatTime(t)}
                  </div>
                ))}
              </div>
            </div>

            {/* Tooltip */}
            {hoveredTime !== null && tooltipData && (
              <div
                className="absolute top-0 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg z-30 pointer-events-none"
                style={{
                  left: `${Math.min(Math.max((hoveredTime / videoDuration) * 100, 10), 90)}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-semibold mb-1">{formatTime(hoveredTime)}</div>
                {tooltipData.segment && (
                  <>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-blue-400" />
                      <span>Viewers: {tooltipData.segment.viewerCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span>Drop-off: {tooltipData.segment.dropoffRate}%</span>
                    </div>
                  </>
                )}
                {tooltipData.chatCount > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-green-400" />
                    <span>Chat: {tooltipData.chatCount} messages</span>
                  </div>
                )}
                {tooltipData.nearbyInteractions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-3 h-3 text-purple-400" />
                    <span>{tooltipData.nearbyInteractions.length} interaction(s)</span>
                  </div>
                )}
                {videoHlsUrl && (
                  <div className="mt-1 pt-1 border-t border-white/20 text-white/60">
                    Click to view video
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating PiP Video Player */}
      {showVideoPlayer && videoHlsUrl && (
        <div
          className={`fixed z-50 bg-black rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
            isVideoExpanded
              ? 'inset-4 md:inset-20'
              : 'bottom-4 right-4 w-80 h-48 md:w-96 md:h-56'
          }`}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            playsInline
            muted
          />

          {/* Video controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <span className="text-white text-sm ml-2">
                  {formatTime(currentVideoTime)} / {formatTime(videoDuration)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                  {isVideoExpanded ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setShowVideoPlayer(false)
                    setIsPlaying(false)
                    setIsVideoExpanded(false)
                  }}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Drag handle for PiP */}
          {!isVideoExpanded && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-center">
              <span className="text-white/60 text-xs">Video Preview</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-blue-400 rounded opacity-60" />
          <span>Viewer retention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-green-500 rounded" />
          <span>Low drop-off</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-yellow-500 rounded" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-red-500 rounded" />
          <span>High drop-off</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Chat activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded-full text-[8px] text-white flex items-center justify-center">P</div>
          <span>Poll</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full text-[8px] text-white flex items-center justify-center">C</div>
          <span>CTA</span>
        </div>
      </div>

      {/* Critical Drop-offs Summary */}
      {criticalDropoffs.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <h4 className="text-sm font-semibold text-red-900 mb-2">Critical Drop-off Points</h4>
          <div className="flex flex-wrap gap-2">
            {criticalDropoffs.map((dropoff, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedTime(dropoff.time)
                  if (videoHlsUrl) setShowVideoPlayer(true)
                }}
                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-lg hover:bg-red-200 transition-colors cursor-pointer"
              >
                {formatTime(dropoff.time)} ({dropoff.dropoffRate}% drop)
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-red-700">
            {videoHlsUrl
              ? 'Click on any timestamp to view the video at that position.'
              : 'Consider reviewing and improving content at these timestamps.'}
          </p>
        </div>
      )}
    </Card>
  )
}
