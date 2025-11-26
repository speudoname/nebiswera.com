'use client'

import { useEffect, useState } from 'react'
import { WebinarRoom } from '@/components/webinar/WebinarRoom'
import { AlertTriangle, RefreshCw } from 'lucide-react'
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
    videoUid: string
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
}

export function WatchPageClient({ slug, token, locale }: WatchPageClientProps) {
  const [data, setData] = useState<WebinarAccessData | null>(null)
  const [error, setError] = useState<string | null>(null)
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
              videoUid: '',
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
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-neu-lg p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            {locale === 'ka' ? 'წვდომა შეუძლებელია' : 'Access Denied'}
          </h1>
          <p className="text-text-secondary mb-6">
            {error || (locale === 'ka' ? 'ვებინარის ჩატვირთვა ვერ მოხერხდა' : 'Could not load webinar')}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            className="flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {locale === 'ka' ? 'სცადეთ თავიდან' : 'Try Again'}
          </Button>
        </div>
      </div>
    )
  }

  // Main webinar room
  return (
    <div className="min-h-screen bg-neu-base">
      {/* Header */}
      <header className="bg-white shadow-neu-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {data.webinar.title}
              </h1>
              {data.access.firstName && (
                <p className="text-sm text-text-secondary">
                  {locale === 'ka' ? 'მოგესალმებით' : 'Welcome'}, {data.access.firstName}!
                </p>
              )}
            </div>
            <div className="text-sm text-text-muted">
              {data.playback.mode === 'simulated_live' && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {locale === 'ka' ? 'პირდაპირი ეთერი' : 'LIVE'}
                </span>
              )}
              {data.playback.mode === 'on_demand' && (
                <span>{locale === 'ka' ? 'მოთხოვნით' : 'On Demand'}</span>
              )}
              {data.playback.mode === 'replay' && (
                <span>{locale === 'ka' ? 'ჩანაწერი' : 'Replay'}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <WebinarRoom
          webinar={{
            id: data.webinar.id,
            title: data.webinar.title,
            description: data.webinar.description || undefined,
            videoUid: data.webinar.videoUid,
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
        />
      </main>
    </div>
  )
}
