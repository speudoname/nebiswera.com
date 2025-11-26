'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { WebinarPlayer } from './WebinarPlayer'
import { WaitingRoom } from './WaitingRoom'
import { InteractionOverlay } from './InteractionOverlay'
import { ChatPanel } from './ChatPanel'
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react'

interface WebinarData {
  id: string
  title: string
  description?: string
  videoUid?: string // Legacy Cloudflare Stream ID
  hlsUrl?: string // R2 HLS URL
  duration?: number
  thumbnailUrl?: string
  presenterName?: string
}

interface AccessData {
  registrationId: string
  firstName?: string
  lastName?: string
  email: string
  sessionType: 'SCHEDULED' | 'JUST_IN_TIME' | 'ON_DEMAND' | 'REPLAY'
}

interface PlaybackData {
  mode: 'simulated_live' | 'on_demand' | 'replay'
  allowSeeking: boolean
  startPosition: number
  lastPosition: number
}

interface InteractionData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: Record<string, unknown>
}

interface WebinarRoomProps {
  webinar: WebinarData
  access: AccessData
  playback: PlaybackData
  interactions: InteractionData[]
  chatEnabled: boolean
  sessionStartsAt?: Date
  accessToken: string
  slug: string
}

export function WebinarRoom({
  webinar,
  access,
  playback,
  interactions,
  chatEnabled,
  sessionStartsAt,
  accessToken,
  slug,
}: WebinarRoomProps) {
  const [currentTime, setCurrentTime] = useState(playback.startPosition)
  const [progress, setProgress] = useState(0)
  const [showChat, setShowChat] = useState(chatEnabled)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [activeInteractions, setActiveInteractions] = useState<InteractionData[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const lastProgressUpdate = useRef(0)

  // Check if we should show waiting room
  useEffect(() => {
    if (sessionStartsAt && playback.mode === 'simulated_live') {
      const now = new Date()
      // Show waiting room if session hasn't started yet (with 5 min early access)
      const earlyAccess = new Date(sessionStartsAt.getTime() - 5 * 60 * 1000)
      if (now < earlyAccess) {
        setShowWaitingRoom(true)
      }
    }
  }, [sessionStartsAt, playback.mode])

  // Handle time updates from player
  const handleTimeUpdate = useCallback((time: number, progressPercent: number) => {
    setCurrentTime(time)
    setProgress(progressPercent)

    // Update watch progress on server every 30 seconds
    if (Math.abs(time - lastProgressUpdate.current) >= 30) {
      lastProgressUpdate.current = time
      updateProgress(progressPercent, time)
    }
  }, [])

  // Update progress on server
  const updateProgress = async (progressPercent: number, position: number) => {
    try {
      await fetch(`/api/webinars/${slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          progress: progressPercent,
          position,
          eventType: 'VIDEO_HEARTBEAT',
        }),
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    updateProgress(100, webinar.duration || 0)
  }, [webinar.duration])

  // Check for interactions that should be shown
  useEffect(() => {
    const currentSecond = Math.floor(currentTime)

    const newActiveInteractions = interactions.filter((interaction) => {
      const triggerTime = interaction.triggerTime
      // Show interaction for 30 seconds or until dismissed
      return currentSecond >= triggerTime && currentSecond < triggerTime + 30
    })

    // Only update if changed
    if (JSON.stringify(newActiveInteractions.map(i => i.id)) !==
        JSON.stringify(activeInteractions.map(i => i.id))) {
      setActiveInteractions(newActiveInteractions)
    }
  }, [currentTime, interactions, activeInteractions])

  // Handle interaction dismiss
  const handleInteractionDismiss = (interactionId: string) => {
    setActiveInteractions((prev) => prev.filter((i) => i.id !== interactionId))
  }

  // Handle interaction response
  const handleInteractionResponse = async (
    interactionId: string,
    response: unknown
  ) => {
    try {
      await fetch(`/api/webinars/${slug}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          interactionId,
          response,
        }),
      })
      handleInteractionDismiss(interactionId)
    } catch (error) {
      console.error('Failed to submit interaction response:', error)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Waiting room
  if (showWaitingRoom && sessionStartsAt) {
    return (
      <WaitingRoom
        webinarTitle={webinar.title}
        thumbnailUrl={webinar.thumbnailUrl}
        presenterName={webinar.presenterName}
        startsAt={sessionStartsAt}
        onStart={() => setShowWaitingRoom(false)}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col lg:flex-row gap-4 ${isFullscreen ? 'bg-black p-4' : ''}`}
    >
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Player */}
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-neu-lg">
          <WebinarPlayer
            videoUid={webinar.videoUid}
            hlsUrl={webinar.hlsUrl}
            playbackMode={playback.mode}
            allowSeeking={playback.allowSeeking}
            startPosition={playback.startPosition}
            duration={webinar.duration}
            poster={webinar.thumbnailUrl}
            onTimeUpdate={handleTimeUpdate}
            onVideoEnd={handleVideoEnd}
          />
        </div>

        {/* Interaction overlay */}
        {activeInteractions.length > 0 && (
          <InteractionOverlay
            interactions={activeInteractions}
            onDismiss={handleInteractionDismiss}
            onRespond={handleInteractionResponse}
            registrationId={access.registrationId}
          />
        )}

        {/* Controls bar */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{webinar.title}</h1>
            {webinar.presenterName && (
              <p className="text-sm text-text-secondary">with {webinar.presenterName}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Chat toggle (mobile) */}
            {chatEnabled && (
              <button
                onClick={() => setShowChat(!showChat)}
                className="lg:hidden p-2 rounded-lg bg-neu-base shadow-neu hover:shadow-neu-hover transition-shadow"
              >
                <MessageCircle className="w-5 h-5 text-text-primary" />
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-neu-base shadow-neu hover:shadow-neu-hover transition-shadow"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-text-primary" />
              ) : (
                <Maximize2 className="w-5 h-5 text-text-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Progress info */}
        {playback.mode !== 'simulated_live' && (
          <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
            <span>{Math.round(progress)}% watched</span>
            {playback.lastPosition > 0 && playback.startPosition > 0 && (
              <span className="text-primary-500">Resumed from where you left off</span>
            )}
          </div>
        )}
      </div>

      {/* Chat panel */}
      {chatEnabled && (
        <div
          className={`
            ${showChat ? 'block' : 'hidden'}
            lg:block
            w-full lg:w-80 xl:w-96
            ${isFullscreen ? 'absolute right-4 top-4 bottom-4 w-80' : ''}
          `}
        >
          <div className="bg-neu-base rounded-xl shadow-neu h-full max-h-[600px] lg:max-h-none">
            <div className="flex items-center justify-between p-4 border-b border-neu-dark">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat
              </h2>
              {/* Close on mobile */}
              <button
                onClick={() => setShowChat(false)}
                className="lg:hidden p-1 rounded hover:bg-neu-dark"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <ChatPanel
              webinarId={webinar.id}
              registrationId={access.registrationId}
              userName={access.firstName || access.email.split('@')[0]}
              accessToken={accessToken}
              slug={slug}
              currentVideoTime={currentTime}
              playbackMode={playback.mode}
            />
          </div>
        </div>
      )}
    </div>
  )
}
