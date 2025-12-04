'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { WebinarPlayer } from './WebinarPlayer'
import { WaitingRoom } from './WaitingRoom'
import { InteractionOverlay } from './InteractionOverlay'
import { ChatPanel } from './ChatPanel'
import { EndScreen } from './EndScreen'
import { Maximize2, Minimize2 } from 'lucide-react'
import { TIMING, THRESHOLDS, minutesToMs } from '@/lib/webinar/constants'

interface WebinarData {
  id: string
  title: string
  description?: string
  hlsUrl: string
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

interface EndScreenConfig {
  enabled: boolean
  title?: string | null
  message?: string | null
  buttonText?: string | null
  buttonUrl?: string | null
  redirectUrl?: string | null
  redirectDelay?: number | null
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
  endScreen?: EndScreenConfig
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
  endScreen,
}: WebinarRoomProps) {
  const [currentTime, setCurrentTime] = useState(playback.startPosition)
  const [progress, setProgress] = useState(0)
  const [showChat, setShowChat] = useState(chatEnabled)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [activeInteractions, setActiveInteractions] = useState<InteractionData[]>([])
  const [videoEnded, setVideoEnded] = useState(false)
  const [showEndScreen, setShowEndScreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastProgressUpdate = useRef(0)
  const sessionJoinTime = useRef<Date>(new Date())
  const waitingRoomEnterTime = useRef<Date | null>(null)
  const hasTrackedJoin = useRef(false)
  const hasTrackedExit = useRef(false)

  // Check if we should show waiting room
  useEffect(() => {
    if (sessionStartsAt && playback.mode === 'simulated_live') {
      const now = new Date()
      // Show waiting room if session hasn't started yet (with early access window)
      const earlyAccess = new Date(sessionStartsAt.getTime() - minutesToMs(TIMING.EARLY_ACCESS_MINUTES))
      if (now < earlyAccess) {
        setShowWaitingRoom(true)
        waitingRoomEnterTime.current = new Date()
      }
    }
  }, [sessionStartsAt, playback.mode])

  // Track session join when video becomes visible
  useEffect(() => {
    if (!showWaitingRoom && !hasTrackedJoin.current) {
      hasTrackedJoin.current = true

      const now = new Date()
      // Simplified SESSION_JOINED metadata - only essential info
      const metadata: Record<string, unknown> = {
        joinTime: now.toISOString(),
        playbackMode: playback.mode,
        sessionType: access.sessionType,
      }

      // Track session join
      fetch(`/api/webinars/${slug}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          eventType: 'SESSION_JOINED',
          metadata,
        }),
      }).catch((error) => {
        console.error('Failed to track session join:', error)
      })
    }
  }, [showWaitingRoom, slug, accessToken, playback.mode, access.sessionType, sessionStartsAt])

  // Track exit patterns - beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasTrackedExit.current) return
      hasTrackedExit.current = true

      const now = new Date()
      const sessionDurationSeconds = Math.floor((now.getTime() - sessionJoinTime.current.getTime()) / 1000)

      // Simplified SESSION_EXITED metadata - no bounce/earlyExit calculations
      const exitMetadata: Record<string, unknown> = {
        exitTime: now.toISOString(),
        sessionDurationSeconds,
        currentVideoPosition: currentTime,
        watchProgress: progress,
        completed: videoEnded,
      }

      // Use sendBeacon for reliability on page unload
      const data = {
        token: accessToken,
        eventType: 'SESSION_EXITED',
        metadata: exitMetadata,
      }

      // Try sendBeacon first (more reliable for unload events)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/webinars/${slug}/analytics`, blob)
      } else {
        // Fallback to sync fetch
        fetch(`/api/webinars/${slug}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {})
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
    }
  }, [slug, accessToken, currentTime, progress, videoEnded])

  // Handle time updates from player
  const handleTimeUpdate = useCallback((time: number, progressPercent: number) => {
    setCurrentTime(time)
    setProgress(progressPercent)

    // Update watch progress on server at regular intervals (but not if video has ended)
    // Note: WebinarPlayer already has jitter built-in, so updates are distributed across users
    if (!videoEnded && Math.abs(time - lastProgressUpdate.current) >= TIMING.PROGRESS_UPDATE_INTERVAL_SECONDS) {
      lastProgressUpdate.current = time
      updateProgress(progressPercent, time)
    }
  }, [videoEnded])

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
    setVideoEnded(true)
    updateProgress(100, webinar.duration || 0)

    // Show end screen if configured
    if (endScreen?.enabled) {
      setShowEndScreen(true)
    }
  }, [webinar.duration, endScreen])

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
    // Note: FIRST_INTERACTION tracking removed - unnecessary metric

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
      className="flex h-full bg-black"
    >
      {/* Main video area - Left side */}
      <div className="flex-1 relative flex flex-col">
        {/* Player */}
        <div className="flex-1 bg-black overflow-hidden">
          <WebinarPlayer
            hlsUrl={webinar.hlsUrl}
            playbackMode={playback.mode}
            allowSeeking={playback.allowSeeking}
            startPosition={playback.startPosition}
            duration={webinar.duration}
            poster={webinar.thumbnailUrl}
            slug={slug}
            accessToken={accessToken}
            onTimeUpdate={handleTimeUpdate}
            onVideoEnd={handleVideoEnd}
          />
        </div>

        {/* Interaction overlay - shows on top of video when not in fullscreen, or always if in fullscreen */}
        {activeInteractions.length > 0 && (
          <InteractionOverlay
            interactions={activeInteractions}
            onDismiss={handleInteractionDismiss}
            onRespond={handleInteractionResponse}
            registrationId={access.registrationId}
          />
        )}

        {/* Fullscreen toggle button (bottom right corner of video) */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors z-10"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-white" />
          ) : (
            <Maximize2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Chat panel - Right side, always visible on desktop, full height */}
      {chatEnabled && !isFullscreen && (
        <div className="w-[400px] flex-shrink-0 bg-white h-full">
          <ChatPanel
            webinarId={webinar.id}
            registrationId={access.registrationId}
            userName={access.firstName || access.email.split('@')[0]}
            accessToken={accessToken}
            slug={slug}
            currentVideoTime={currentTime}
            playbackMode={playback.mode}
            interactions={activeInteractions}
            onInteractionDismiss={handleInteractionDismiss}
            onInteractionRespond={handleInteractionResponse}
          />
        </div>
      )}

      {/* In fullscreen, show chat overlay on right side of video */}
      {chatEnabled && isFullscreen && (
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-white/95 backdrop-blur-sm">
          <ChatPanel
            webinarId={webinar.id}
            registrationId={access.registrationId}
            userName={access.firstName || access.email.split('@')[0]}
            accessToken={accessToken}
            slug={slug}
            currentVideoTime={currentTime}
            playbackMode={playback.mode}
            interactions={activeInteractions}
            onInteractionDismiss={handleInteractionDismiss}
            onInteractionRespond={handleInteractionResponse}
          />
        </div>
      )}

      {/* End screen overlay */}
      {showEndScreen && endScreen?.enabled && (
        <EndScreen
          title={endScreen.title}
          message={endScreen.message}
          buttonText={endScreen.buttonText}
          buttonUrl={endScreen.buttonUrl}
          redirectUrl={endScreen.redirectUrl}
          redirectDelay={endScreen.redirectDelay}
          slug={slug}
          accessToken={accessToken}
          onClose={() => setShowEndScreen(false)}
        />
      )}
    </div>
  )
}
