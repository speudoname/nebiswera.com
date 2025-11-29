'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  Target,
  TrendingUp,
  Download,
  RefreshCw,
  FileText,
  BarChart3,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react'

interface InteractionAnalytics {
  id: string
  type: string
  title: string
  triggerTime: number
  responseCount: number
  responseRate: number
  aggregatedResults: any
}

interface DropOffPoint {
  range: string
  count: number
  percentage: number
}

interface AnalyticsData {
  webinar: {
    id: string
    title: string
    duration: number
  }
  overview: {
    totalRegistrations: number
    totalViewers: number
    totalInteractions: number
    totalResponses: number
    engagementScore: number
    completionRate: number
  }
  interactions: InteractionAnalytics[]
  dropOffAnalysis: DropOffPoint[]
}

interface InteractionAnalyticsProps {
  webinarId: string
}

export function InteractionAnalytics({ webinarId }: InteractionAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/webinars/${webinarId}/analytics/interactions`)
      if (!response.ok) throw new Error('Failed to fetch interaction analytics')
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

  const exportToCSV = () => {
    if (!data) return

    // Build CSV content
    const headers = [
      'Interaction ID',
      'Type',
      'Title',
      'Trigger Time (s)',
      'Response Count',
      'Response Rate (%)',
    ]

    const rows = data.interactions.map((i) => [
      i.id,
      i.type,
      i.title,
      i.triggerTime.toString(),
      i.responseCount.toString(),
      i.responseRate.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webinar-interaction-analytics-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card variant="raised" padding="md">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card variant="raised" padding="lg">
        <div className="text-center py-8">
          <p className="text-red-500">{error || 'Failed to load analytics'}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Try again
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interaction Analytics</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neu-light shadow-neu hover:shadow-neu-inset transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Interactions"
          value={data.overview.totalInteractions}
          icon={Target}
          color="text-purple-500"
        />
        <StatCard
          title="Total Responses"
          value={data.overview.totalResponses}
          icon={MessageSquare}
          color="text-blue-500"
        />
        <StatCard
          title="Engagement Score"
          value={`${data.overview.engagementScore.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-green-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${data.overview.completionRate.toFixed(1)}%`}
          icon={ThumbsUp}
          color="text-orange-500"
        />
      </div>

      {/* Drop-off Analysis */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          Viewer Drop-off Analysis
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Where viewers stop watching (grouped by watch percentage)
        </p>
        <div className="space-y-2">
          {data.dropOffAnalysis.map((point) => (
            <div key={point.range} className="flex items-center gap-3">
              <span className="w-20 text-sm text-text-secondary">{point.range}</span>
              <div className="flex-1 h-6 bg-neu-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                  style={{ width: `${point.percentage}%` }}
                />
              </div>
              <span className="w-24 text-sm text-text-primary text-right">
                {point.count} viewers ({point.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Interaction Details */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Interaction Performance
        </h3>
        <div className="space-y-6">
          {data.interactions.map((interaction) => (
            <InteractionCard key={interaction.id} interaction={interaction} />
          ))}

          {data.interactions.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              <p>No interactions created yet.</p>
              <p className="text-sm mt-2">Add interactions to see analytics here.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card variant="raised" padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </Card>
  )
}

function InteractionCard({ interaction }: { interaction: InteractionAnalytics }) {
  const { type, title, triggerTime, responseCount, responseRate, aggregatedResults } = interaction

  return (
    <div className="border border-neu-dark rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-100 text-primary-700">
              {type}
            </span>
            <span className="text-xs text-text-secondary">{formatTime(triggerTime)}</span>
          </div>
          <h4 className="font-semibold text-text-primary">{title}</h4>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-text-primary">{responseCount}</div>
          <div className="text-xs text-text-secondary">responses</div>
        </div>
      </div>

      {/* Response Rate Bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-text-secondary">Response Rate</span>
          <span
            className={`font-semibold ${
              responseRate >= 50
                ? 'text-green-500'
                : responseRate >= 25
                  ? 'text-yellow-500'
                  : 'text-red-500'
            }`}
          >
            {responseRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-neu-dark rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              responseRate >= 50
                ? 'bg-green-500'
                : responseRate >= 25
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, responseRate)}%` }}
          />
        </div>
      </div>

      {/* Aggregated Results */}
      {aggregatedResults && (
        <div className="pt-3 border-t border-neu-dark">
          {/* Poll/Quiz Results */}
          {(type === 'POLL' || type === 'QUIZ') && aggregatedResults.options && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-text-primary">Results:</div>
              {aggregatedResults.options.map((option: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary">{option.option}</span>
                      <span className="text-text-primary font-medium">
                        {option.count} ({option.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-neu-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          option.isCorrect ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {type === 'QUIZ' && (
                <div className="mt-2 text-sm">
                  <span className="text-text-secondary">Accuracy: </span>
                  <span className="font-semibold text-green-500">
                    {aggregatedResults.accuracy?.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Feedback Results */}
          {type === 'FEEDBACK' && aggregatedResults.ratings && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-text-primary">Ratings:</div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">👍 Great</span>
                    <span className="text-text-primary">{aggregatedResults.ratings[1]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">😐 Okay</span>
                    <span className="text-text-primary">{aggregatedResults.ratings[2]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">👎 Poor</span>
                    <span className="text-text-primary">{aggregatedResults.ratings[3]}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {aggregatedResults.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-text-secondary">avg rating</div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Form Results */}
          {type === 'CONTACT_FORM' && (
            <div className="text-sm text-text-secondary">
              {aggregatedResults.totalSubmissions} form submissions collected
            </div>
          )}

          {/* Question Results */}
          {type === 'QUESTION' && aggregatedResults.responses && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="text-sm font-semibold text-text-primary">
                Responses ({aggregatedResults.totalResponses}):
              </div>
              {aggregatedResults.responses.slice(0, 5).map((response: any, index: number) => (
                <div key={index} className="text-sm bg-neu-dark/30 p-2 rounded">
                  <div className="text-text-primary">&ldquo;{response.text}&rdquo;</div>
                  <div className="text-xs text-text-secondary mt-1">
                    - {response.user}
                  </div>
                </div>
              ))}
              {aggregatedResults.responses.length > 5 && (
                <div className="text-xs text-text-secondary text-center">
                  +{aggregatedResults.responses.length - 5} more responses
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
