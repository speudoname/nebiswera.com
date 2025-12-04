'use client'

import { useState, useEffect } from 'react'
import { X, User, Clock, Download, BarChart3, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface WidgetResponse {
  id: string
  user: {
    id: string
    email: string
    name: string
    registeredAt: Date
  }
  selectedOption?: string | null
  answerText?: string | null
  respondedAt: Date
}

interface CtaClick {
  id: string
  user: {
    id: string
    email: string
    name: string
    registeredAt: Date
  }
  clickedAt: Date
}

interface Distribution {
  option: string
  count: number
  percentage: number
}

interface InteractionData {
  interaction: {
    id: string
    type: string
    title: string
    triggersAt: number
    viewCount: number
    actionCount: number
    question?: string
    options?: string[]
    ctaButtonText?: string
    ctaButtonUrl?: string
  }
  responses: WidgetResponse[]
  ctaClicks: CtaClick[]
  distribution: Distribution[]
  stats: {
    totalViews: number
    totalResponses: number
    engagementRate: number
  }
}

interface WidgetResponseModalProps {
  webinarId: string
  interactionId: string
  onClose: () => void
  onUserClick?: (registrationId: string) => void
}

export function WidgetResponseModal({
  webinarId,
  interactionId,
  onClose,
  onUserClick,
}: WidgetResponseModalProps) {
  const [data, setData] = useState<InteractionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/admin/webinars/${webinarId}/interactions/${interactionId}/responses`
        )
        if (!response.ok) throw new Error('Failed to fetch responses')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load responses')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [webinarId, interactionId])

  const handleExportCSV = () => {
    if (!data) return

    const rows: string[][] = []

    if (data.interaction.type === 'POLL') {
      rows.push(['Name', 'Email', 'Selected Option', 'Answer Text', 'Responded At'])
      data.responses.forEach((r) => {
        rows.push([
          r.user.name,
          r.user.email,
          r.selectedOption || '',
          r.answerText || '',
          new Date(r.respondedAt).toLocaleString(),
        ])
      })
    } else {
      rows.push(['Name', 'Email', 'Clicked At'])
      data.ctaClicks.forEach((c) => {
        rows.push([
          c.user.name,
          c.user.email,
          new Date(c.clickedAt).toLocaleString(),
        ])
      })
    }

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.interaction.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neu-base rounded-neu-lg shadow-neu-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b-2 border-neu-dark">
          <div className="flex-1">
            {loading ? (
              <div className="h-6 bg-neu-light rounded animate-pulse w-48" />
            ) : error ? (
              <h2 className="text-xl font-bold text-red-600">Error Loading Responses</h2>
            ) : data ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {data.interaction.type === 'POLL' && <MessageSquare className="w-5 h-5 text-primary-500" />}
                  {(data.interaction.type === 'CTA' || data.interaction.type === 'DOWNLOAD' || data.interaction.type === 'SPECIAL_OFFER') && (
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                  )}
                  <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded">
                    {data.interaction.type}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">{data.interaction.title}</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Triggers at {formatTime(data.interaction.triggersAt)}
                </p>
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-neu-light rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card variant="raised" padding="md">
                  <p className="text-sm text-text-secondary">Total Views</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {data.stats.totalViews}
                  </p>
                </Card>
                <Card variant="raised" padding="md">
                  <p className="text-sm text-text-secondary">Total Responses</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {data.stats.totalResponses}
                  </p>
                </Card>
                <Card variant="raised" padding="md">
                  <p className="text-sm text-text-secondary">Engagement Rate</p>
                  <p className="text-2xl font-bold text-primary-600 mt-1">
                    {data.stats.engagementRate}%
                  </p>
                </Card>
              </div>

              {/* Poll Distribution */}
              {data.interaction.type === 'POLL' && data.distribution.length > 0 && (
                <Card variant="raised" padding="md">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Response Distribution
                  </h3>
                  <div className="space-y-3">
                    {data.distribution.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-primary">{item.option}</span>
                          <span className="text-sm font-medium text-text-secondary">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-neu-light rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Responses List */}
              <Card variant="raised" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {data.interaction.type === 'POLL' ? 'Individual Responses' : 'CTA Clicks'}
                  </h3>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.interaction.type === 'POLL' ? (
                    data.responses.length > 0 ? (
                      data.responses.map((response) => (
                        <div
                          key={response.id}
                          className="p-3 bg-neu-light rounded-lg hover:shadow-neu transition-all cursor-pointer"
                          onClick={() => onUserClick?.(response.user.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-text-primary">
                                  {response.user.name}
                                </p>
                                <p className="text-xs text-text-secondary">{response.user.email}</p>
                                {response.selectedOption && (
                                  <p className="text-sm text-primary-600 mt-1 font-medium">
                                    Selected: {response.selectedOption}
                                  </p>
                                )}
                                {response.answerText && (
                                  <p className="text-sm text-text-primary mt-1">
                                    {response.answerText}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {new Date(response.respondedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-text-secondary py-8">No responses yet</p>
                    )
                  ) : (
                    data.ctaClicks.length > 0 ? (
                      data.ctaClicks.map((click) => (
                        <div
                          key={click.id}
                          className="p-3 bg-neu-light rounded-lg hover:shadow-neu transition-all cursor-pointer"
                          onClick={() => onUserClick?.(click.user.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">
                                  {click.user.name}
                                </p>
                                <p className="text-xs text-text-secondary">{click.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-text-secondary">
                              <Clock className="w-3 h-3" />
                              {new Date(click.clickedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-text-secondary py-8">No clicks yet</p>
                    )
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
