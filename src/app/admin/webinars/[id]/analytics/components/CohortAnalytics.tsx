'use client'

import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface SessionMetrics {
  sessionId: string
  sessionDate: string
  sessionType: string
  registrations: number
  attendanceRate: number
  completionRate: number
  avgWatchTime: number
  avgEngagementScore: number
}

interface CohortData {
  sessions: SessionMetrics[]
  trends: {
    attendanceRate: 'up' | 'down' | 'stable'
    completionRate: 'up' | 'down' | 'stable'
    engagement: 'up' | 'down' | 'stable'
  }
  bestSession: SessionMetrics | null
  worstSession: SessionMetrics | null
}

interface CohortAnalyticsProps {
  data: CohortData
}

export function CohortAnalytics({ data }: CohortAnalyticsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      case 'stable':
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Card variant="raised" padding="lg">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-text-primary">Session Comparison</h3>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${getTrendColor(data.trends.attendanceRate)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Attendance</span>
            {getTrendIcon(data.trends.attendanceRate)}
          </div>
          <p className="text-sm font-semibold">
            {data.trends.attendanceRate === 'up' ? 'Improving' : data.trends.attendanceRate === 'down' ? 'Declining' : 'Stable'}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${getTrendColor(data.trends.completionRate)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Completion</span>
            {getTrendIcon(data.trends.completionRate)}
          </div>
          <p className="text-sm font-semibold">
            {data.trends.completionRate === 'up' ? 'Improving' : data.trends.completionRate === 'down' ? 'Declining' : 'Stable'}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${getTrendColor(data.trends.engagement)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Engagement</span>
            {getTrendIcon(data.trends.engagement)}
          </div>
          <p className="text-sm font-semibold">
            {data.trends.engagement === 'up' ? 'Improving' : data.trends.engagement === 'down' ? 'Declining' : 'Stable'}
          </p>
        </div>
      </div>

      {/* Sessions Table */}
      {data.sessions.length > 0 ? (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead className="bg-neu-base border-b-2 border-neu-dark">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-text-primary">Date</th>
                <th className="px-3 py-2 text-left font-medium text-text-primary">Type</th>
                <th className="px-3 py-2 text-right font-medium text-text-primary">Registrations</th>
                <th className="px-3 py-2 text-right font-medium text-text-primary">Attendance</th>
                <th className="px-3 py-2 text-right font-medium text-text-primary">Completion</th>
                <th className="px-3 py-2 text-right font-medium text-text-primary">Avg Watch</th>
                <th className="px-3 py-2 text-right font-medium text-text-primary">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neu-dark">
              {data.sessions.map((session) => {
                const isBest = data.bestSession?.sessionId === session.sessionId
                const isWorst = data.worstSession?.sessionId === session.sessionId

                return (
                  <tr
                    key={session.sessionId}
                    className={`hover:bg-neu-base/50 ${
                      isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-text-primary">
                      {formatDate(session.sessionDate)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-1 bg-neu-dark rounded">
                        {session.sessionType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary font-medium">
                      {session.registrations}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${
                        session.attendanceRate >= 70 ? 'text-green-600' :
                        session.attendanceRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {session.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${
                        session.completionRate >= 60 ? 'text-green-600' :
                        session.completionRate >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {session.completionRate}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatTime(session.avgWatchTime)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${
                        session.avgEngagementScore >= 70 ? 'text-green-600' :
                        session.avgEngagementScore >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {session.avgEngagementScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center bg-neu-light rounded-lg mb-6">
          <p className="text-sm text-text-secondary">No sessions to compare</p>
        </div>
      )}

      {/* Best vs Worst Session */}
      {data.bestSession && data.worstSession && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-xs text-green-700 font-medium mb-2">Best Performing</p>
            <p className="text-sm font-semibold text-green-900 mb-1">
              {formatDate(data.bestSession.sessionDate)}
            </p>
            <div className="text-xs text-green-700 space-y-1">
              <div>Attendance: {data.bestSession.attendanceRate}%</div>
              <div>Completion: {data.bestSession.completionRate}%</div>
              <div>Engagement: {data.bestSession.avgEngagementScore.toFixed(1)}</div>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <p className="text-xs text-red-700 font-medium mb-2">Needs Improvement</p>
            <p className="text-sm font-semibold text-red-900 mb-1">
              {formatDate(data.worstSession.sessionDate)}
            </p>
            <div className="text-xs text-red-700 space-y-1">
              <div>Attendance: {data.worstSession.attendanceRate}%</div>
              <div>Completion: {data.worstSession.completionRate}%</div>
              <div>Engagement: {data.worstSession.avgEngagementScore.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Insight:</strong>{' '}
          {data.sessions.length < 2
            ? 'Need at least 2 sessions to perform cohort analysis.'
            : data.trends.attendanceRate === 'down' && data.trends.completionRate === 'down'
            ? 'Declining trends across metrics - consider adjusting webinar timing or promotional strategy.'
            : data.trends.engagement === 'up'
            ? 'Engagement is improving! Recent content changes are resonating with your audience.'
            : 'Performance is stable. Look at best-performing sessions to identify success patterns.'}
        </p>
      </div>
    </Card>
  )
}
