'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { WebinarPlayer } from './WebinarPlayer'
import { WaitingRoom } from './WaitingRoom'
import { InteractionOverlay } from './InteractionOverlay'
import { ChatPanel } from './ChatPanel'
import { EndScreen } from './EndScreen'
import { Maximize2, Minimize2, MessageCircle, X, Play, MessageSquare } from 'lucide-react'
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
  mode: 'simulated_live' | 'replay'
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

// Hook to detect landscape orientation
function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile/tablet AND landscape
      const isMobileDevice = window.innerWidth < 1024
      const isLandscapeOrientation = window.innerWidth > window.innerHeight
      setIsLandscape(isMobileDevice && isLandscapeOrientation)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return isLandscape
}

// Hook to detect mobile (portrait) mode
function useIsMobilePortrait() {
  const [isMobilePortrait, setIsMobilePortrait] = useState(false)

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 1024
      const isPortrait = window.innerHeight > window.innerWidth
      setIsMobilePortrait(isMobile && isPortrait)
    }

    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)

    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  return isMobilePortrait
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
  const [showChatInLandscape, setShowChatInLandscape] = useState(false)
  const [mobileTab, setMobileTab] = useState<'video' | 'chat'>('video')
  const containerRef = useRef<HTMLDivElement>(null)

  const isLandscape = useIsLandscape()
  const isMobilePortrait = useIsMobilePortrait()

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

  // Interaction timing - tracks active, answered, and all triggered interactions
  const {
    activeInteractions,
    allTriggeredInteractions,
    dismissInteraction,
    markAsAnswered,
  } = useInteractionTiming({
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

  // Handle interaction response - this submits to the API and tracks for pixel
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
      // Note: we no longer dismiss here - the interaction stays visible with results
    } catch (error) {
      console.error('Failed to submit interaction response:', error)
    }
  }, [slug, accessToken, trackCTAClick])

  // Handle marking interaction as answered (called from ChatPanel/InteractiveWidgets)
  const handleInteractionAnswered = useCallback((interactionId: string, response: unknown) => {
    markAsAnswered(interactionId, response)
  }, [markAsAnswered])

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

  // ===========================================
  // MOBILE PORTRAIT LAYOUT
  // ===========================================
  if (isMobilePortrait && !isFullscreen) {
    return (
      <div ref={containerRef} className="flex flex-col h-full bg-black">
        {/* Video section - fixed aspect ratio 16:9 */}
        <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}>
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

        {/* Tab bar */}
        {chatEnabled && (
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setMobileTab('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                mobileTab === 'video'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Play className="w-4 h-4" />
              Video
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                mobileTab === 'chat'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>
        )}

        {/* Tab content area */}
        <div className="flex-1 overflow-hidden bg-white">
          {mobileTab === 'video' ? (
            // Video tab - show webinar info when no active interactions
            <div className="h-full overflow-y-auto p-4">
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Play className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Watching: {webinar.title}</p>
                {webinar.presenterName && (
                  <p className="text-xs text-gray-400 mt-1">with {webinar.presenterName}</p>
                )}
              </div>
            </div>
          ) : (
            // Chat tab - includes all triggered interactions with All/Widgets tabs
            <ChatPanel
              webinarId={webinar.id}
              registrationId={access.registrationId}
              userName={userName}
              accessToken={accessToken}
              slug={slug}
              currentVideoTime={currentTime}
              playbackMode={playback.mode}
              interactions={allTriggeredInteractions}
              onInteractionDismiss={dismissInteraction}
              onInteractionRespond={handleInteractionResponse}
              onInteractionAnswered={handleInteractionAnswered}
            />
          )}
        </div>

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

  // ===========================================
  // MOBILE LANDSCAPE LAYOUT
  // ===========================================
  if (isLandscape && !isFullscreen) {
    return (
      <div ref={containerRef} className="flex h-full bg-black relative">
        {/* Full-width video */}
        <div className="flex-1 relative">
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

          {/* Interaction overlay on video in landscape - only when chat is hidden */}
          {activeInteractions.length > 0 && !showChatInLandscape && (
            <InteractionOverlay
              interactions={activeInteractions}
              onDismiss={dismissInteraction}
              onRespond={handleInteractionResponse}
              onInteractionAnswered={handleInteractionAnswered}
              registrationId={access.registrationId}
            />
          )}

          {/* Chat toggle button */}
          {chatEnabled && (
            <button
              onClick={() => setShowChatInLandscape(!showChatInLandscape)}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
            >
              {showChatInLandscape ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Chat panel - slides in from right */}
        {chatEnabled && showChatInLandscape && (
          <div className="w-[300px] bg-white flex-shrink-0 animate-slide-in-right">
            <div className="h-full">
              <ChatPanel
                webinarId={webinar.id}
                registrationId={access.registrationId}
                userName={userName}
                accessToken={accessToken}
                slug={slug}
                currentVideoTime={currentTime}
                playbackMode={playback.mode}
                interactions={allTriggeredInteractions}
                onInteractionDismiss={dismissInteraction}
                onInteractionRespond={handleInteractionResponse}
                onInteractionAnswered={handleInteractionAnswered}
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

  // ===========================================
  // DESKTOP LAYOUT (and fullscreen)
  // ===========================================
  return (
    <div
      ref={containerRef}
      className="flex h-full bg-black"
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

        {/* Interaction overlay - only show in fullscreen mode when sidebar is hidden */}
        {activeInteractions.length > 0 && isFullscreen && !showChatInLandscape && (
          <InteractionOverlay
            interactions={activeInteractions}
            onDismiss={dismissInteraction}
            onRespond={handleInteractionResponse}
            onInteractionAnswered={handleInteractionAnswered}
            registrationId={access.registrationId}
          />
        )}

        {/* Video control buttons (bottom right) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          {/* Chat toggle button for fullscreen mode */}
          {chatEnabled && isFullscreen && (
            <button
              onClick={() => setShowChatInLandscape(!showChatInLandscape)}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              title={showChatInLandscape ? 'Hide chat' : 'Show chat'}
            >
              {showChatInLandscape ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop chat panel - Right side */}
      {chatEnabled && !isFullscreen && (
        <div className="w-[400px] flex-shrink-0 bg-white h-full">
          <ChatPanel
            webinarId={webinar.id}
            registrationId={access.registrationId}
            userName={userName}
            accessToken={accessToken}
            slug={slug}
            currentVideoTime={currentTime}
            playbackMode={playback.mode}
            interactions={allTriggeredInteractions}
            onInteractionDismiss={dismissInteraction}
            onInteractionRespond={handleInteractionResponse}
            onInteractionAnswered={handleInteractionAnswered}
          />
        </div>
      )}

      {/* Fullscreen chat overlay - Toggleable */}
      {chatEnabled && isFullscreen && showChatInLandscape && (
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-white/95 backdrop-blur-sm shadow-2xl z-20">
          <div className="h-full">
            <ChatPanel
              webinarId={webinar.id}
              registrationId={access.registrationId}
              userName={userName}
              accessToken={accessToken}
              slug={slug}
              currentVideoTime={currentTime}
              playbackMode={playback.mode}
              interactions={allTriggeredInteractions}
              onInteractionDismiss={dismissInteraction}
              onInteractionRespond={handleInteractionResponse}
              onInteractionAnswered={handleInteractionAnswered}
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

// ===========================================
// Mobile Interaction Card Component
// ===========================================
interface MobileInteractionCardProps {
  interaction: InteractionData
  onDismiss: (id: string) => void
  onRespond: (id: string, response: unknown, type?: string, title?: string) => void
  registrationId: string
}

function MobileInteractionCard({
  interaction,
  onDismiss,
  onRespond,
  registrationId,
}: MobileInteractionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [textResponse, setTextResponse] = useState('')

  const handleSubmit = () => {
    if (interaction.type === 'POLL' && selectedOption) {
      onRespond(interaction.id, selectedOption, interaction.type, interaction.title)
    } else if (interaction.type === 'QUESTION' && textResponse.trim()) {
      onRespond(interaction.id, textResponse, interaction.type, interaction.title)
    } else if (interaction.type === 'CTA' || interaction.type === 'SPECIAL_OFFER') {
      const url = interaction.config?.buttonUrl
      if (url) {
        window.open(url, '_blank')
      }
      onRespond(interaction.id, 'clicked', interaction.type, interaction.title)
    } else {
      onDismiss(interaction.id)
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900">{interaction.title}</h3>
        <button
          onClick={() => onDismiss(interaction.id)}
          className="p-1 rounded-full hover:bg-gray-200 text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Poll options */}
      {interaction.type === 'POLL' && interaction.config?.options && (
        <div className="space-y-2 mb-4">
          {(interaction.config.options as string[]).map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(option)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedOption === option
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Question input */}
      {interaction.type === 'QUESTION' && (
        <textarea
          value={textResponse}
          onChange={(e) => setTextResponse(e.target.value)}
          placeholder="Type your answer..."
          className="w-full p-3 border border-gray-200 rounded-lg mb-4 resize-none"
          rows={3}
        />
      )}

      {/* CTA / Special offer */}
      {(interaction.type === 'CTA' || interaction.type === 'SPECIAL_OFFER') && (
        <p className="text-gray-600 text-sm mb-4">
          {interaction.config?.description || 'Click the button below to learn more.'}
        </p>
      )}

      {/* Tip */}
      {interaction.type === 'TIP' && (
        <p className="text-gray-600 text-sm mb-4">
          {interaction.config?.description}
        </p>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
      >
        {interaction.type === 'POLL' && 'Submit Answer'}
        {interaction.type === 'QUESTION' && 'Submit'}
        {(interaction.type === 'CTA' || interaction.type === 'SPECIAL_OFFER') &&
          (interaction.config?.buttonText || 'Learn More')}
        {interaction.type === 'TIP' && 'Got it'}
        {!['POLL', 'QUESTION', 'CTA', 'SPECIAL_OFFER', 'TIP'].includes(interaction.type) && 'Continue'}
      </button>
    </div>
  )
}
