'use client'

import { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  Play,
  MessageSquare,
  MousePointer,
  CheckCircle,
  Activity,
  ExternalLink,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatDuration } from '@/lib'

interface TimelineEvent {
  id: string
  type: 'EVENT' | 'POLL' | 'CHAT'
  eventType?: string
  title: string
  description?: string
  timestamp: Date
  metadata?: unknown
}

interface RegistrationData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  registeredAt: Date
  joinedAt: Date | null
  completedAt: Date | null
  source: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  engagementScore: number | null
  maxVideoPosition: number
  watchPercentage: number
  ctaClickCount: number
  session: {
    id: string
    scheduledAt: Date
    type: string
  } | null
}

interface JourneyData {
  registration: RegistrationData
  webinar: {
    id: string
    title: string
    slug: string
    videoDuration: number | null
  }
  metrics: {
    totalEvents: number
    pollResponses: number
    chatMessages: number
    videoEvents: number
    sessionDurationSeconds: number
    timeToFirstInteraction: number | null
    completed: boolean
  }
  timeline: TimelineEvent[]
}

interface UserProfileModalProps {
  webinarId: string
  registrationId: string
  onClose: () => void
}

export function UserProfileModal({
  webinarId,
  registrationId,
  onClose,
}: UserProfileModalProps) {
  const [data, setData] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/admin/webinars/${webinarId}/registrants/${registrationId}/journey`
        )
        if (!response.ok) throw new Error('Failed to fetch user journey')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user journey')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [webinarId, registrationId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getEngagementLabel = (score: number | null) => {
    if (score === null) return { label: 'Not Calculated', color: 'text-text-secondary' }
    if (score >= 80) return { label: 'Highly Engaged', color: 'text-green-600' }
    if (score >= 60) return { label: 'Engaged', color: 'text-blue-600' }
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-600' }
    if (score >= 20) return { label: 'Low', color: 'text-orange-600' }
    return { label: 'Minimal', color: 'text-red-600' }
  }

  const getEventIcon = (type: string, eventType?: string) => {
    if (type === 'CHAT') return <MessageSquare className="w-4 h-4" />
    if (type === 'POLL') return <MousePointer className="w-4 h-4" />

    switch (eventType) {
      case 'SESSION_JOINED':
        return <Play className="w-4 h-4" />
      case 'SESSION_EXITED':
        return <X className="w-4 h-4" />
      case 'VIDEO_STARTED':
      case 'VIDEO_PLAYED':
        return <Play className="w-4 h-4" />
      case 'FIRST_INTERACTION':
        return <MousePointer className="w-4 h-4" />
      case 'END_SCREEN_VIEWED':
      case 'END_SCREEN_CTA_CLICKED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getEventColor = (type: string, eventType?: string) => {
    if (type === 'CHAT') return 'bg-blue-100 text-blue-600'
    if (type === 'POLL') return 'bg-purple-100 text-purple-600'

    switch (eventType) {
      case 'SESSION_JOINED':
        return 'bg-green-100 text-green-600'
      case 'SESSION_EXITED':
        return 'bg-gray-100 text-gray-600'
      case 'VIDEO_STARTED':
      case 'VIDEO_PLAYED':
        return 'bg-primary-100 text-primary-600'
      case 'FIRST_INTERACTION':
        return 'bg-yellow-100 text-yellow-600'
      case 'END_SCREEN_VIEWED':
      case 'END_SCREEN_CTA_CLICKED':
        return 'bg-emerald-100 text-emerald-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neu-base rounded-neu-lg shadow-neu-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b-2 border-neu-dark">
          <div className="flex-1">
            {loading ? (
              <div className="h-6 bg-neu-light rounded animate-pulse w-48" />
            ) : error ? (
              <h2 className="text-xl font-bold text-red-600">Error Loading User Profile</h2>
            ) : data ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {data.registration.firstName && data.registration.lastName
                        ? `${data.registration.firstName} ${data.registration.lastName}`
                        : data.registration.email}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Mail className="w-4 h-4" />
                      {data.registration.email}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neu-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-neu-light rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="raised" padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary-500" />
                    <p className="text-xs text-text-secondary">Engagement</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {data.registration.engagementScore?.toFixed(1) || 'N/A'}
                  </p>
                  <p className={`text-xs mt-1 ${getEngagementLabel(data.registration.engagementScore).color}`}>
                    {getEngagementLabel(data.registration.engagementScore).label}
                  </p>
                </Card>

                <Card variant="raised" padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-4 h-4 text-primary-500" />
                    <p className="text-xs text-text-secondary">Watch %</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {data.registration.watchPercentage}%
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatTime(data.registration.maxVideoPosition)} watched
                  </p>
                </Card>

                <Card variant="raised" padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary-500" />
                    <p className="text-xs text-text-secondary">Activity</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {data.metrics.chatMessages + data.metrics.pollResponses}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {data.metrics.chatMessages} chats, {data.metrics.pollResponses} polls
                  </p>
                </Card>

                <Card variant="raised" padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    <p className="text-xs text-text-secondary">Duration</p>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatDuration(data.metrics.sessionDurationSeconds)}
                  </p>
                  {data.metrics.completed && (
                    <p className="text-xs text-green-600 mt-1">Completed</p>
                  )}
                </Card>
              </div>

              {/* Registration Details */}
              <Card variant="raised" padding="md">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Registration Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Registered</p>
                    <p className="text-text-primary font-medium">
                      {new Date(data.registration.registeredAt).toLocaleString()}
                    </p>
                  </div>
                  {data.registration.joinedAt && (
                    <div>
                      <p className="text-text-secondary">First Joined</p>
                      <p className="text-text-primary font-medium">
                        {new Date(data.registration.joinedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {data.registration.source && (
                    <div>
                      <p className="text-text-secondary">Source</p>
                      <p className="text-text-primary font-medium">{data.registration.source}</p>
                    </div>
                  )}
                  {data.registration.utmCampaign && (
                    <div>
                      <p className="text-text-secondary">Campaign</p>
                      <p className="text-text-primary font-medium flex items-center gap-1">
                        {data.registration.utmCampaign}
                        {data.registration.utmSource && (
                          <span className="text-xs text-text-secondary">
                            ({data.registration.utmSource})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {data.registration.session && (
                    <div>
                      <p className="text-text-secondary">Session Type</p>
                      <p className="text-text-primary font-medium">{data.registration.session.type}</p>
                    </div>
                  )}
                  {data.metrics.timeToFirstInteraction !== null && (
                    <div>
                      <p className="text-text-secondary">Time to First Interaction</p>
                      <p className="text-text-primary font-medium">
                        {formatDuration(data.metrics.timeToFirstInteraction)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Timeline */}
              <Card variant="raised" padding="md">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Activity Timeline</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.timeline.length > 0 ? (
                    data.timeline.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-neu-light rounded-lg hover:shadow-neu transition-all"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getEventColor(
                            event.type,
                            event.eventType
                          )}`}
                        >
                          {getEventIcon(event.type, event.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-text-secondary mt-1">{event.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-text-secondary py-8">No activity recorded</p>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <a
                  href={`/admin/webinars/${webinarId}/registrants?search=${encodeURIComponent(data.registration.email)}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  View in Registrants
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
