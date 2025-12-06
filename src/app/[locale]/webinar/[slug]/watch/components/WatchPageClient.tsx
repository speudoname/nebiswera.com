'use client'

import { useEffect, useState } from 'react'
import { WebinarRoom } from './WebinarRoom'
import { AlertTriangle, RefreshCw, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface WatchPageClientProps {
  slug: string
  token: string
  locale: string
}

interface WebinarAccessData {
  access: {
    valid: boolean
    registrationId: string
    firstName: string | null
    lastName: string | null
    email: string
    sessionType: 'SCHEDULED' | 'JUST_IN_TIME' | 'ON_DEMAND' | 'REPLAY'
  }
  webinar: {
    id: string
    title: string
    description: string | null
    hlsUrl: string
    duration: number | null
    thumbnailUrl: string | null
    presenterName?: string
  }
  playback: {
    mode: 'simulated_live' | 'on_demand' | 'replay'
    allowSeeking: boolean
    startPosition: number
    lastPosition: number
  }
  interactions: Array<{
    id: string
    type: string
    triggerTime: number
    title: string
    config: Record<string, unknown>
  }>
  chat: {
    enabled: boolean
  }
  endScreen?: {
    enabled: boolean
    title?: string | null
    message?: string | null
    buttonText?: string | null
    buttonUrl?: string | null
    redirectUrl?: string | null
    redirectDelay?: number | null
  }
}

export function WatchPageClient({ slug, token, locale }: WatchPageClientProps) {
  const [data, setData] = useState<WebinarAccessData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'generic' | 'expired' | 'disabled' | 'sessionEnded' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [waitingRoom, setWaitingRoom] = useState<{ startsAt: string } | null>(null)

  useEffect(() => {
    const fetchAccessData = async () => {
      try {
        const response = await fetch(`/api/webinars/${slug}/access?token=${token}`)
        const result = await response.json()

        if (!response.ok) {
          if (result.waitingRoom) {
            setWaitingRoom({ startsAt: result.startsAt })
            setIsLoading(false)
            return
          }
          // Handle specific error types
          if (result.sessionEnded) {
            setErrorType('sessionEnded')
            throw new Error(result.error || 'Session has ended')
          }
          if (result.replayExpired) {
            setErrorType('expired')
            throw new Error(result.error || 'Replay has expired')
          }
          if (result.replayDisabled) {
            setErrorType('disabled')
            throw new Error(result.error || 'Replay is not available')
          }
          setErrorType('generic')
          throw new Error(result.error || 'Failed to validate access')
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccessData()
  }, [slug, token])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-text-secondary">Loading webinar...</p>
        </div>
      </div>
    )
  }

  // Waiting room state
  if (waitingRoom) {
    return (
      <div className="min-h-screen bg-neu-base p-8">
        <div className="max-w-4xl mx-auto">
          <WebinarRoom
            webinar={{
              id: '',
              title: 'Loading...',
              hlsUrl: '',
            }}
            access={{
              registrationId: '',
              email: '',
              sessionType: 'SCHEDULED',
            }}
            playback={{
              mode: 'simulated_live',
              allowSeeking: false,
              startPosition: 0,
              lastPosition: 0,
            }}
            interactions={[]}
            chatEnabled={false}
            sessionStartsAt={new Date(waitingRoom.startsAt)}
            accessToken={token}
            slug={slug}
          />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    const getErrorContent = () => {
      if (errorType === 'sessionEnded') {
        return {
          icon: Clock,
          iconColor: 'text-blue-500',
          title: locale === 'ka' ? 'სესია დასრულდა' : 'Session Has Ended',
          description: locale === 'ka'
            ? 'ეს პირდაპირი სესია დასრულდა. ჩანაწერი მალე იქნება ხელმისაწვდომი.'
            : 'This live session has ended. A replay will be available soon.',
          showRetry: true,
        }
      }
      if (errorType === 'expired') {
        return {
          icon: Clock,
          iconColor: 'text-orange-500',
          title: locale === 'ka' ? 'ჩანაწერის ვადა ამოიწურა' : 'Replay Has Expired',
          description: locale === 'ka'
            ? 'ამ ვებინარის ჩანაწერის ნახვის ვადა ამოიწურა.'
            : 'The replay for this webinar is no longer available.',
          showRetry: false,
        }
      }
      if (errorType === 'disabled') {
        return {
          icon: XCircle,
          iconColor: 'text-gray-500',
          title: locale === 'ka' ? 'ჩანაწერი მიუწვდომელია' : 'Replay Unavailable',
          description: locale === 'ka'
            ? 'ამ ვებინარისთვის ჩანაწერი არ არის ხელმისაწვდომი.'
            : 'Replay is not available for this webinar.',
          showRetry: false,
        }
      }
      return {
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        title: locale === 'ka' ? 'წვდომა შეუძლებელია' : 'Access Denied',
        description: error || (locale === 'ka' ? 'ვებინარის ჩატვირთვა ვერ მოხერხდა' : 'Could not load webinar'),
        showRetry: true,
      }
    }

    const errorContent = getErrorContent()
    const ErrorIcon = errorContent.icon

    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-neu-lg p-8 max-w-md text-center">
          <ErrorIcon className={`w-12 h-12 ${errorContent.iconColor} mx-auto mb-4`} />
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            {errorContent.title}
          </h1>
          <p className="text-text-secondary mb-6">
            {errorContent.description}
          </p>
          {errorContent.showRetry && (
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              {locale === 'ka' ? 'სცადეთ თავიდან' : 'Try Again'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Main webinar room - fullscreen without header
  return (
    <div className="h-screen bg-black overflow-hidden">
      <WebinarRoom
        webinar={{
          id: data.webinar.id,
          title: data.webinar.title,
          description: data.webinar.description || undefined,
          hlsUrl: data.webinar.hlsUrl,
          duration: data.webinar.duration || undefined,
          thumbnailUrl: data.webinar.thumbnailUrl || undefined,
          presenterName: data.webinar.presenterName,
        }}
        access={{
          registrationId: data.access.registrationId,
          firstName: data.access.firstName || undefined,
          lastName: data.access.lastName || undefined,
          email: data.access.email,
          sessionType: data.access.sessionType,
        }}
        playback={data.playback}
        interactions={data.interactions}
        chatEnabled={data.chat.enabled}
        accessToken={token}
        slug={slug}
        endScreen={data.endScreen}
      />
    </div>
  )
}
