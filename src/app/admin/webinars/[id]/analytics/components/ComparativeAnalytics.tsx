'use client'

import { BarChart3, Award, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface BenchmarkMetric {
  label: string
  current: number
  average: number
  best: number
  unit: string
  percentile: number
}

interface ComparativeData {
  metrics: BenchmarkMetric[]
  overallScore: number
  rank: string
}

interface ComparativeAnalyticsProps {
  data: ComparativeData
}

export function ComparativeAnalytics({ data }: ComparativeAnalyticsProps) {
  const getPerformanceColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600'
    if (percentile >= 50) return 'text-blue-600'
    if (percentile >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceLabel = (percentile: number) => {
    if (percentile >= 75) return 'Excellent'
    if (percentile >= 50) return 'Above Average'
    if (percentile >= 25) return 'Below Average'
    return 'Needs Improvement'
  }

  const getBarColor = (type: 'current' | 'average' | 'best') => {
    switch (type) {
      case 'current':
        return 'bg-primary-500'
      case 'average':
        return 'bg-gray-400'
      case 'best':
        return 'bg-green-500'
    }
  }

  return (
    <Card variant="raised" padding="lg">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-text-primary">Performance Benchmarks</h3>
      </div>

      {/* Overall Score */}
      <div className="mb-6 p-6 bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg border-2 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">Overall Performance</p>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-primary-600" />
              <span className="text-3xl font-bold text-primary-600">
                {data.overallScore}
              </span>
              <span className="text-lg text-text-secondary">/ 100</span>
            </div>
            <p className="text-sm font-medium text-primary-700 mt-1">{data.rank}</p>
          </div>
          <div className="text-center">
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.overallScore / 100)}`}
                  className="text-primary-500 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-text-primary">{data.overallScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="space-y-6">
        {data.metrics.map((metric, index) => {
          const maxValue = Math.max(metric.current, metric.average, metric.best)
          const currentPercent = (metric.current / maxValue) * 100
          const averagePercent = (metric.average / maxValue) * 100
          const bestPercent = (metric.best / maxValue) * 100

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">{metric.label}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${getPerformanceColor(metric.percentile)}`}>
                    {getPerformanceLabel(metric.percentile)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {metric.percentile}th percentile
                  </span>
                </div>
              </div>

              {/* Comparison Bars */}
              <div className="space-y-2">
                {/* Current */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-16">This Webinar</span>
                  <div className="flex-1 h-8 bg-neu-dark rounded overflow-hidden relative">
                    <div
                      className={`h-full ${getBarColor('current')} transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${currentPercent}%` }}
                    >
                      {currentPercent > 15 && (
                        <span className="text-xs font-medium text-white">
                          {metric.current}{metric.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary w-16 text-right">
                    {metric.current}{metric.unit}
                  </span>
                </div>

                {/* Average */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-16">Average</span>
                  <div className="flex-1 h-6 bg-neu-dark rounded overflow-hidden relative">
                    <div
                      className={`h-full ${getBarColor('average')} opacity-60 transition-all duration-500`}
                      style={{ width: `${averagePercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-16 text-right">
                    {metric.average}{metric.unit}
                  </span>
                </div>

                {/* Best */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-16">Best</span>
                  <div className="flex-1 h-6 bg-neu-dark rounded overflow-hidden relative">
                    <div
                      className={`h-full ${getBarColor('best')} opacity-60 transition-all duration-500`}
                      style={{ width: `${bestPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-16 text-right">
                    {metric.best}{metric.unit}
                  </span>
                </div>
              </div>

              {/* Gap Analysis */}
              {metric.current < metric.average && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>
                      {metric.average - metric.current}{metric.unit} below average -
                      {' '}{Math.round(((metric.average - metric.current) / metric.average) * 100)}% gap
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 p-3 bg-purple-50 rounded-lg">
        <p className="text-xs text-purple-900">
          <strong>Insight:</strong>{' '}
          {data.overallScore >= 75
            ? 'Outstanding performance! You\'re in the top 25% of webinars. Keep up the excellent work.'
            : data.overallScore >= 50
            ? 'Solid performance with room for growth. Focus on metrics below the 50th percentile for quick wins.'
            : 'Significant improvement opportunities identified. Start by optimizing your weakest metrics for maximum impact.'}
        </p>
      </div>
    </Card>
  )
}
