'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { WebinarPlayer } from './WebinarPlayer'
import { WaitingRoom } from './WaitingRoom'
import { InteractionOverlay } from './InteractionOverlay'
import { ChatPanel } from './ChatPanel'
import { EndScreen } from './EndScreen'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useWaitingRoom } from '../hooks/useWaitingRoom'
import { useWebinarAnalytics } from '../hooks/useWebinarAnalytics'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useInteractionTiming } from '../hooks/useInteractionTiming'

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
  const [videoEnded, setVideoEnded] = useState(false)
  const [showEndScreen, setShowEndScreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Waiting room management
  const { showWaitingRoom, handleStart } = useWaitingRoom({
    sessionStartsAt,
    playbackMode: playback.mode,
  })

  // Progress tracking
  const { currentTime, progress, handleTimeUpdate, updateProgress } = useProgressTracking({
    slug,
    accessToken,
    videoEnded,
  })

  // Analytics tracking
  useWebinarAnalytics({
    slug,
    accessToken,
    showWaitingRoom,
    playbackMode: playback.mode,
    sessionType: access.sessionType,
    currentTime,
    progress,
    videoEnded,
    sessionStartsAt,
  })

  // Interaction timing
  const { activeInteractions, dismissInteraction } = useInteractionTiming({
    currentTime,
    interactions,
  })

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true)
    updateProgress(100, webinar.duration || 0)

    // Show end screen if configured
    if (endScreen?.enabled) {
      setShowEndScreen(true)
    }
  }, [webinar.duration, endScreen, updateProgress])

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
      dismissInteraction(interactionId)
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
        onStart={handleStart}
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
            onDismiss={dismissInteraction}
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
            onInteractionDismiss={dismissInteraction}
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
            onInteractionDismiss={dismissInteraction}
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
