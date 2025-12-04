'use client'

import { Clock, TrendingDown, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface TimeSegment {
  startSecond: number
  endSecond: number
  viewerCount: number
  dropoffCount: number
  dropoffRate: number
}

interface TimeBasedData {
  segments: TimeSegment[]
  avgSessionDuration: number
  peakViewers: {
    time: number
    count: number
  }
  criticalDropoffs: Array<{
    time: number
    dropoffRate: number
  }>
}

interface TimeBasedAnalyticsProps {
  data: TimeBasedData
  videoDuration: number
}

export function TimeBasedAnalytics({ data, videoDuration }: TimeBasedAnalyticsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const maxViewers = Math.max(...data.segments.map((s) => s.viewerCount), 1)
  const maxDropoffRate = Math.max(...data.segments.map((s) => s.dropoffRate), 1)

  const getHeatColor = (dropoffRate: number) => {
    if (dropoffRate > 30) return 'bg-red-500'
    if (dropoffRate > 20) return 'bg-orange-500'
    if (dropoffRate > 10) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card variant="raised" padding="lg">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-text-primary">Time-Based Analytics</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-neu-light rounded-lg">
          <p className="text-sm text-text-secondary mb-1">Avg Watch Time</p>
          <p className="text-2xl font-bold text-text-primary">
            {formatTime(data.avgSessionDuration)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {Math.round((data.avgSessionDuration / videoDuration) * 100)}% of video
          </p>
        </div>
        <div className="p-4 bg-neu-light rounded-lg">
          <p className="text-sm text-text-secondary mb-1">Peak Viewership</p>
          <p className="text-2xl font-bold text-primary-600">{data.peakViewers.count}</p>
          <p className="text-xs text-text-secondary mt-1">
            at {formatTime(data.peakViewers.time)}
          </p>
        </div>
      </div>

      {/* Video Drop-off Heatmap */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-text-primary mb-3">Video Drop-off Heatmap</h4>

        {data.segments.length > 0 ? (
          <>
            {/* Heatmap Bars */}
            <div className="space-y-2 mb-4">
              {data.segments.map((segment, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary w-12 flex-shrink-0">
                      {formatTime(segment.startSecond)}
                    </span>
                    <div className="flex-1 h-8 bg-neu-dark rounded overflow-hidden relative">
                      {/* Viewer count bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-200 opacity-30"
                        style={{ width: `${(segment.viewerCount / maxViewers) * 100}%` }}
                      />
                      {/* Drop-off rate bar */}
                      <div
                        className={`absolute inset-y-0 left-0 ${getHeatColor(segment.dropoffRate)} opacity-70`}
                        style={{ width: `${(segment.dropoffRate / maxDropoffRate) * 100}%` }}
                      />
                      {/* Label */}
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-primary">
                        {segment.dropoffRate > 0 && `${segment.dropoffRate}% drop-off`}
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary w-12 flex-shrink-0 text-right">
                      {segment.viewerCount}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute left-14 bottom-full mb-1 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                    <div>Time: {formatTime(segment.startSecond)} - {formatTime(segment.endSecond)}</div>
                    <div>Viewers: {segment.viewerCount}</div>
                    <div>Dropped: {segment.dropoffCount} ({segment.dropoffRate}%)</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Low (&lt;10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Medium (10-20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>High (20-30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Critical (&gt;30%)</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-32 flex items-center justify-center bg-neu-light rounded-lg">
            <p className="text-sm text-text-secondary">No time-based data available</p>
          </div>
        )}
      </div>

      {/* Critical Drop-off Points */}
      {data.criticalDropoffs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-medium text-text-primary">Critical Drop-off Points</h4>
          </div>
          <div className="space-y-2">
            {data.criticalDropoffs.map((dropoff, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {formatTime(dropoff.time)}
                    </p>
                    <p className="text-xs text-red-700">
                      Review content at this timestamp
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{dropoff.dropoffRate}%</p>
                  <p className="text-xs text-red-700">drop-off</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Insight:</strong>{' '}
          {data.criticalDropoffs.length > 0
            ? `${data.criticalDropoffs.length} critical drop-off point${data.criticalDropoffs.length > 1 ? 's' : ''} detected. Consider shortening or improving content at these timestamps.`
            : data.avgSessionDuration / videoDuration > 0.7
            ? 'Excellent retention throughout the video! Viewers are staying engaged.'
            : data.avgSessionDuration / videoDuration > 0.4
            ? 'Moderate retention. Consider adding engagement hooks in the second half.'
            : 'Low retention detected. Review video length and content pacing.'}
        </p>
      </div>
    </Card>
  )
}
