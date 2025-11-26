'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  Users,
  Eye,
  CheckCircle,
  MessageSquare,
  Clock,
  TrendingUp,
  BarChart3,
  MousePointer,
  RefreshCw,
  Award,
  Star,
} from 'lucide-react'

interface AnalyticsData {
  webinar: {
    id: string
    title: string
    slug: string
    status: string
    videoDuration: number | null
    createdAt: string
  }
  overview: {
    totalRegistrations: number
    totalAttended: number
    totalCompleted: number
    attendanceRate: number
    completionRate: number
    avgWatchTimeSeconds: number
    avgWatchPercent: number
    chatMessageCount: number
  }
  registrations: {
    byType: Array<{ type: string; count: number }>
    byDate: Array<{ date: string; count: number }>
    bySource: Array<{ source: string; count: number }>
  }
  engagement: {
    interactions: Array<{
      id: string
      type: string
      title: string
      triggerTime: number
      viewCount: number
      actionCount: number
      engagementRate: number
    }>
    watchTimeDistribution: Array<{ bucket: string; count: number }>
    eventBreakdown: Array<{ type: string; count: number }>
    scores: {
      distribution: Array<{ label: string; count: number; percentage: number }>
      averageScore: number
      topEngaged: Array<{ email: string; score: number }>
    }
  }
  attribution: {
    utm: Array<{
      source: string | null
      medium: string | null
      campaign: string | null
      count: number
    }>
  }
  recentActivity: Array<{
    id: string
    type: string
    timestamp: string
    metadata: Record<string, unknown>
  }>
}

interface AnalyticsDashboardProps {
  webinarId: string
}

export function AnalyticsDashboard({ webinarId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/webinars/${webinarId}/analytics`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [webinarId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card variant="raised" padding="lg">
        <div className="text-center py-8">
          <p className="text-red-500">{error || 'Failed to load analytics'}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 text-primary-500 hover:text-primary-600"
          >
            Try again
          </button>
        </div>
      </Card>
    )
  }

  const { overview, registrations, engagement, attribution, recentActivity } = data

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registrations"
          value={overview.totalRegistrations}
          icon={Users}
          color="text-blue-500"
        />
        <StatCard
          title="Attended"
          value={overview.totalAttended}
          subtitle={`${overview.attendanceRate}% rate`}
          icon={Eye}
          color="text-green-500"
        />
        <StatCard
          title="Completed"
          value={overview.totalCompleted}
          subtitle={`${overview.completionRate}% of attendees`}
          icon={CheckCircle}
          color="text-purple-500"
        />
        <StatCard
          title="Chat Messages"
          value={overview.chatMessageCount}
          icon={MessageSquare}
          color="text-orange-500"
        />
      </div>

      {/* Watch Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            Average Watch Time
          </h3>
          <div className="text-3xl font-bold text-text-primary">
            {formatTime(overview.avgWatchTimeSeconds)}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {overview.avgWatchPercent}% of video watched on average
          </div>
        </Card>

        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Watch Time Distribution
          </h3>
          <div className="space-y-2">
            {engagement.watchTimeDistribution.map((item) => (
              <div key={item.bucket} className="flex items-center gap-2">
                <span className="w-20 text-sm text-text-secondary">{item.bucket}</span>
                <div className="flex-1 h-4 bg-neu-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (item.count / Math.max(1, overview.totalAttended)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-sm text-text-primary text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Engagement Scores */}
      {engagement.scores && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="raised" padding="md">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-500" />
              Engagement Score Distribution
            </h3>
            <div className="mb-4">
              <div className="text-3xl font-bold text-text-primary">
                {engagement.scores.averageScore}
              </div>
              <div className="text-sm text-text-secondary">Average Score</div>
            </div>
            <div className="space-y-2">
              {engagement.scores.distribution.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-36 text-sm text-text-secondary truncate">{item.label}</span>
                  <div className="flex-1 h-4 bg-neu-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.label.includes('Highly') ? 'bg-green-500' :
                        item.label.includes('Engaged') ? 'bg-blue-500' :
                        item.label.includes('Moderate') ? 'bg-yellow-500' :
                        item.label.includes('Low') ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-text-primary text-right">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="raised" padding="md">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary-500" />
              Top Engaged Attendees
            </h3>
            {engagement.scores.topEngaged.length > 0 ? (
              <div className="space-y-2">
                {engagement.scores.topEngaged.map((person, index) => (
                  <div key={person.email} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-amber-600 text-amber-100' :
                        'bg-neu-dark text-text-secondary'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-text-primary truncate max-w-[180px]">
                        {person.email}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      person.score >= 80 ? 'text-green-500' :
                      person.score >= 60 ? 'text-blue-500' :
                      person.score >= 40 ? 'text-yellow-500' : 'text-orange-500'
                    }`}>
                      {person.score}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No engagement data yet</p>
            )}
          </Card>
        </div>
      )}

      {/* Registration Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Registrations by Type
          </h3>
          <div className="space-y-3">
            {registrations.byType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-text-secondary">{formatSessionType(item.type)}</span>
                <span className="font-semibold text-text-primary">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Traffic Sources
          </h3>
          <div className="space-y-3">
            {registrations.bySource.slice(0, 5).map((item) => (
              <div key={item.source} className="flex items-center justify-between">
                <span className="text-text-secondary capitalize">{item.source}</span>
                <span className="font-semibold text-text-primary">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Interaction Engagement */}
      {engagement.interactions.length > 0 && (
        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-primary-500" />
            Interaction Engagement
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-text-secondary text-sm border-b border-neu-dark">
                  <th className="pb-2">Interaction</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Time</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">Actions</th>
                  <th className="pb-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {engagement.interactions.map((interaction) => (
                  <tr key={interaction.id} className="border-b border-neu-dark/50">
                    <td className="py-2 text-text-primary">{interaction.title}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 text-xs rounded bg-primary-100 text-primary-700">
                        {interaction.type}
                      </span>
                    </td>
                    <td className="py-2 text-right text-text-secondary">
                      {formatTime(interaction.triggerTime)}
                    </td>
                    <td className="py-2 text-right text-text-primary">{interaction.viewCount}</td>
                    <td className="py-2 text-right text-text-primary">{interaction.actionCount}</td>
                    <td className="py-2 text-right">
                      <span className={`font-semibold ${
                        interaction.engagementRate >= 50 ? 'text-green-500' :
                        interaction.engagementRate >= 25 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {interaction.engagementRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* UTM Attribution */}
      {attribution.utm.length > 0 && (
        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4">UTM Attribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-text-secondary text-sm border-b border-neu-dark">
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Medium</th>
                  <th className="pb-2">Campaign</th>
                  <th className="pb-2 text-right">Registrations</th>
                </tr>
              </thead>
              <tbody>
                {attribution.utm.map((item, index) => (
                  <tr key={index} className="border-b border-neu-dark/50">
                    <td className="py-2 text-text-primary">{item.source || '-'}</td>
                    <td className="py-2 text-text-secondary">{item.medium || '-'}</td>
                    <td className="py-2 text-text-secondary">{item.campaign || '-'}</td>
                    <td className="py-2 text-right font-semibold text-text-primary">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Event Activity */}
      {engagement.eventBreakdown.length > 0 && (
        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Event Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {engagement.eventBreakdown.map((event) => (
              <div key={event.type} className="text-center p-3 bg-neu-dark/30 rounded-lg">
                <div className="text-2xl font-bold text-text-primary">{event.count}</div>
                <div className="text-sm text-text-secondary">{formatEventType(event.type)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card variant="raised" padding="md">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentActivity.slice(0, 20).map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-neu-dark/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {formatEventType(event.type)}
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  subtitle?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card variant="raised" padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </Card>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

function formatSessionType(type: string): string {
  const types: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    ON_DEMAND: 'On-Demand',
    REPLAY: 'Replay',
    JUST_IN_TIME: 'Just-in-Time',
  }
  return types[type] || type
}

function formatEventType(type: string): string {
  const types: Record<string, string> = {
    REGISTRATION: 'Registration',
    ATTENDANCE: 'Attendance',
    VIDEO_STARTED: 'Video Started',
    VIDEO_COMPLETED: 'Video Completed',
    VIDEO_PROGRESS: 'Video Progress',
    POLL_ANSWERED: 'Poll Answered',
    CTA_CLICKED: 'CTA Clicked',
    DOWNLOAD_CLICKED: 'Download Clicked',
    FEEDBACK_GIVEN: 'Feedback Given',
    CHAT_MESSAGE: 'Chat Message',
    DROP_OFF: 'Drop Off',
  }
  return types[type] || type.replace(/_/g, ' ')
}
