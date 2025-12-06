'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { WebinarPlayer } from './WebinarPlayer'
import { WaitingRoom } from './WaitingRoom'
import { InteractionOverlay } from './InteractionOverlay'
import { ChatPanel } from './ChatPanel'
import { EndScreen } from './EndScreen'
import { Maximize2, Minimize2, MessageCircle, X } from 'lucide-react'
import { useWaitingRoom } from '../hooks/useWaitingRoom'
import { useWebinarAnalytics } from '../hooks/useWebinarAnalytics'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useInteractionTiming } from '../hooks/useInteractionTiming'
import { useWebinarPixelTracking } from '../hooks/useWebinarPixelTracking'
import type { InteractionData } from '@/types'

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
  const [showChatInFullscreen, setShowChatInFullscreen] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
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

  // Facebook Pixel tracking
  const { trackCTAClick } = useWebinarPixelTracking({
    webinarId: webinar.id,
    webinarTitle: webinar.title,
    showWaitingRoom,
    playbackMode: playback.mode,
    sessionType: access.sessionType,
    progress,
    videoEnded,
  })

  // Interaction timing
  const { activeInteractions, dismissInteraction } = useInteractionTiming({
    currentTime,
    interactions,
  })

  // Memoize derived values to prevent unnecessary re-renders
  const userName = useMemo(
    () => access.firstName || access.email.split('@')[0],
    [access.firstName, access.email]
  )

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
  const handleInteractionResponse = useCallback(async (
    interactionId: string,
    response: unknown,
    interactionType?: string,
    interactionTitle?: string
  ) => {
    try {
      // Track CTA click for pixel
      if (interactionType) {
        trackCTAClick(interactionType, interactionTitle)
      }

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
  }, [slug, accessToken, dismissInteraction, trackCTAClick])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [isFullscreen])

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
      className="flex flex-col lg:flex-row h-full bg-black"
    >
      {/* Main video area */}
      <div className="flex-1 relative flex flex-col min-h-0">
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

        {/* Interaction overlay */}
        {activeInteractions.length > 0 && (
          <InteractionOverlay
            interactions={activeInteractions}
            onDismiss={dismissInteraction}
            onRespond={handleInteractionResponse}
            registrationId={access.registrationId}
          />
        )}

        {/* Video control buttons (bottom right) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          {/* Chat toggle button for fullscreen mode (desktop) */}
          {chatEnabled && isFullscreen && (
            <button
              onClick={() => setShowChatInFullscreen(!showChatInFullscreen)}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              title={showChatInFullscreen ? 'Hide chat' : 'Show chat'}
            >
              {showChatInFullscreen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          {/* Fullscreen toggle - hidden on mobile */}
          <button
            onClick={toggleFullscreen}
            className="hidden lg:block p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Mobile chat toggle button (floating) */}
        {chatEnabled && !isFullscreen && (
          <button
            onClick={() => setShowMobileChat(!showMobileChat)}
            className="lg:hidden fixed bottom-4 right-4 p-4 rounded-full bg-primary-600 hover:bg-primary-700 shadow-lg transition-colors z-30"
            title={showMobileChat ? 'Hide chat' : 'Show chat'}
          >
            {showMobileChat ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Desktop chat panel - Right side, hidden on mobile */}
      {chatEnabled && !isFullscreen && (
        <div className="hidden lg:block w-[400px] flex-shrink-0 bg-white h-full">
          <ChatPanel
            webinarId={webinar.id}
            registrationId={access.registrationId}
            userName={userName}
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

      {/* Mobile chat panel - Slide up from bottom */}
      {chatEnabled && !isFullscreen && showMobileChat && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setShowMobileChat(false)}
          />
          {/* Chat panel */}
          <div className="h-[70vh] bg-white rounded-t-2xl shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="font-medium text-gray-900">Chat</span>
              <button
                onClick={() => setShowMobileChat(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="h-[calc(70vh-52px)]">
              <ChatPanel
                webinarId={webinar.id}
                registrationId={access.registrationId}
                userName={userName}
                accessToken={accessToken}
                slug={slug}
                currentVideoTime={currentTime}
                playbackMode={playback.mode}
                interactions={activeInteractions}
                onInteractionDismiss={dismissInteraction}
                onInteractionRespond={handleInteractionResponse}
              />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen chat overlay - Toggleable */}
      {chatEnabled && isFullscreen && showChatInFullscreen && (
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-white/95 backdrop-blur-sm shadow-2xl z-20">
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <span className="font-medium text-gray-900">Chat</span>
            <button
              onClick={() => setShowChatInFullscreen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="h-[calc(100%-52px)]">
            <ChatPanel
              webinarId={webinar.id}
              registrationId={access.registrationId}
              userName={userName}
              accessToken={accessToken}
              slug={slug}
              currentVideoTime={currentTime}
              playbackMode={playback.mode}
              interactions={activeInteractions}
              onInteractionDismiss={dismissInteraction}
              onInteractionRespond={handleInteractionResponse}
            />
          </div>
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
