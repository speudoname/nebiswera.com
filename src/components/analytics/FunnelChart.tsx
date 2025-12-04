'use client'

import { TrendingDown, Users, Eye, MousePointer, CheckCircle, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface FunnelStage {
  label: string
  count: number
  percentage: number
  dropoff?: number
}

interface FunnelData {
  registered: number
  attended: number
  engaged: number
  completed: number
  converted: number
}

interface FunnelChartProps {
  data: FunnelData
}

export function FunnelChart({ data }: FunnelChartProps) {
  const stages: FunnelStage[] = [
    {
      label: 'Registered',
      count: data.registered,
      percentage: 100,
    },
    {
      label: 'Attended',
      count: data.attended,
      percentage: data.registered > 0 ? Math.round((data.attended / data.registered) * 100) : 0,
      dropoff: data.registered > 0 ? Math.round(((data.registered - data.attended) / data.registered) * 100) : 0,
    },
    {
      label: 'Engaged',
      count: data.engaged,
      percentage: data.registered > 0 ? Math.round((data.engaged / data.registered) * 100) : 0,
      dropoff: data.attended > 0 ? Math.round(((data.attended - data.engaged) / data.attended) * 100) : 0,
    },
    {
      label: 'Completed',
      count: data.completed,
      percentage: data.registered > 0 ? Math.round((data.completed / data.registered) * 100) : 0,
      dropoff: data.engaged > 0 ? Math.round(((data.engaged - data.completed) / data.engaged) * 100) : 0,
    },
    {
      label: 'Converted',
      count: data.converted,
      percentage: data.registered > 0 ? Math.round((data.converted / data.registered) * 100) : 0,
      dropoff: data.completed > 0 ? Math.round(((data.completed - data.converted) / data.completed) * 100) : 0,
    },
  ]

  const getIcon = (label: string) => {
    switch (label) {
      case 'Registered':
        return <Users className="w-5 h-5" />
      case 'Attended':
        return <Eye className="w-5 h-5" />
      case 'Engaged':
        return <MousePointer className="w-5 h-5" />
      case 'Completed':
        return <CheckCircle className="w-5 h-5" />
      case 'Converted':
        return <ExternalLink className="w-5 h-5" />
      default:
        return null
    }
  }

  const getColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-purple-500',
    ]
    return colors[index] || 'bg-gray-500'
  }

  return (
    <Card variant="raised" padding="lg">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Conversion Funnel</h3>

      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            {/* Stage Bar */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-2">
                <div className={`w-10 h-10 rounded-full ${getColor(index)} text-white flex items-center justify-center flex-shrink-0`}>
                  {getIcon(stage.label)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{stage.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        {stage.count.toLocaleString()} users
                      </span>
                      <span className="text-sm font-semibold text-text-primary min-w-[3rem] text-right">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neu-dark rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full ${getColor(index)} rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.percentage > 15 && (
                        <span className="text-xs font-medium text-white">
                          {stage.count.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drop-off Indicator */}
              {index > 0 && stage.dropoff !== undefined && stage.dropoff > 0 && (
                <div className="flex items-center gap-2 ml-14 mt-1">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">
                    {stage.dropoff}% drop-off from previous stage
                  </span>
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="w-0.5 h-4 bg-neu-dark"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t-2 border-neu-dark">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {stages[1].percentage}%
            </p>
            <p className="text-xs text-text-secondary mt-1">Attendance Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {stages[3].percentage}%
            </p>
            <p className="text-xs text-text-secondary mt-1">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {stages[4].percentage}%
            </p>
            <p className="text-xs text-text-secondary mt-1">Conversion Rate</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Insight:</strong> {
            stages[1].percentage < 50
              ? 'Low attendance rate - consider follow-up emails or reminder notifications.'
              : stages[3].percentage < 30
              ? 'Good attendance but low completion - review content engagement and video length.'
              : stages[4].percentage < 10
              ? 'High completion but low conversion - optimize your CTA placement and messaging.'
              : 'Strong performance across all funnel stages!'
          }
        </p>
      </div>
    </Card>
  )
}
