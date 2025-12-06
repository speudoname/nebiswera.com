'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Eye,
  Clock,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Link2,
  ArrowRight,
  Share2,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  RefreshCw,
  Globe,
} from 'lucide-react'

interface BlogPostDetail {
  post: {
    id: string
    titleKa: string
    titleEn: string
    slugKa: string
    slugEn: string
    status: string
    publishedAt: string | null
    readingTimeMinutes: number | null
    allTimeViews: number
  }
  overview: {
    periodViews: number
    uniqueSessions: number
    avgDuration: number
    avgScrollDepth: number
    engagementRate: number
    bounceRate: number
    linkClicks: number
    shares: number
    buttonClicks: number
  }
  referrers: Array<{ domain: string; count: number }>
  linkClicks: Array<{ url: string; count: number; text: string; type: string }>
  nextPages: Array<{ path: string; count: number }>
  durationDistribution: Record<string, number>
  scrollDistribution: Record<string, number>
  deviceBreakdown: { DESKTOP: number; MOBILE: number; TABLET: number }
  dailyViews: Array<{ date: string; count: number }>
  recentViews: Array<{
    path: string
    locale: string
    duration: number
    scrollDepth: number
    engaged: boolean
    bounced: boolean
    referrerDomain: string | null
    deviceType: string
    browser: string
    os: string
    enteredAt: string
  }>
}

interface Props {
  postId: string
  days: number
  onClose: () => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function StatBox({ label, value, icon: Icon, color = 'gray' }: {
  label: string
  value: string | number
  icon: React.ElementType
  color?: 'gray' | 'green' | 'red' | 'blue' | 'purple'
}) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case 'DESKTOP':
      return <Monitor className="w-4 h-4" />
    case 'MOBILE':
      return <Smartphone className="w-4 h-4" />
    case 'TABLET':
      return <Tablet className="w-4 h-4" />
    default:
      return <Monitor className="w-4 h-4" />
  }
}

export function BlogPostDetailModal({ postId, days, onClose }: Props) {
  const [data, setData] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'engagement' | 'activity'>('overview')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/analytics/blog/${postId}?days=${days}`)
        if (!res.ok) throw new Error('Failed to fetch')
        setData(await res.json())
      } catch {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [postId, days])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const maxReferrerCount = data?.referrers?.[0]?.count || 1

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-16">
        <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {data?.post.titleKa || data?.post.titleEn || 'Blog Post Analytics'}
              </h2>
              {data?.post && (
                <div className="flex items-center gap-3 mt-1">
                  <a
                    href={`/blog/${data.post.slugKa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    /blog/{data.post.slugKa}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    Last {days} days
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-100 px-6 shrink-0">
            <div className="flex gap-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'traffic', label: 'Traffic Sources' },
                { id: 'engagement', label: 'Engagement' },
                { id: 'activity', label: 'Recent Activity' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64 text-red-500">
                {error}
              </div>
            )}

            {data && activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox
                    label="Period Views"
                    value={data.overview.periodViews.toLocaleString()}
                    icon={Eye}
                    color="blue"
                  />
                  <StatBox
                    label="All-time Views"
                    value={data.post.allTimeViews.toLocaleString()}
                    icon={Eye}
                    color="purple"
                  />
                  <StatBox
                    label="Avg. Time on Page"
                    value={formatDuration(data.overview.avgDuration)}
                    icon={Clock}
                    color="green"
                  />
                  <StatBox
                    label="Unique Sessions"
                    value={data.overview.uniqueSessions}
                    icon={Globe}
                    color="gray"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox
                    label="Engagement Rate"
                    value={`${data.overview.engagementRate}%`}
                    icon={TrendingUp}
                    color="green"
                  />
                  <StatBox
                    label="Bounce Rate"
                    value={`${data.overview.bounceRate}%`}
                    icon={TrendingDown}
                    color="red"
                  />
                  <StatBox
                    label="Avg. Scroll Depth"
                    value={`${data.overview.avgScrollDepth}%`}
                    icon={MousePointer}
                    color="blue"
                  />
                  <StatBox
                    label="Link Clicks"
                    value={data.overview.linkClicks}
                    icon={Link2}
                    color="purple"
                  />
                </div>

                {/* Daily Views Chart */}
                {data.dailyViews.length > 0 && (
                  <div className="bg-white rounded-xl p-5 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Daily Views</h3>
                    <div className="h-24 flex items-end gap-1">
                      {data.dailyViews.map((day, idx) => {
                        const maxViews = Math.max(...data.dailyViews.map(d => d.count), 1)
                        const height = Math.max((day.count / maxViews) * 100, 2)
                        return (
                          <div key={idx} className="flex-1 group relative">
                            <div
                              className="w-full bg-primary-500 rounded-t hover:bg-primary-600 cursor-pointer transition-colors"
                              style={{ height: `${height}%` }}
                            />
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.count}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Device & Scroll Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-5 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Device Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(data.deviceBreakdown).map(([device, count]) => {
                        const total = Object.values(data.deviceBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                          <div key={device} className="flex items-center gap-3">
                            <DeviceIcon device={device} />
                            <span className="text-sm text-gray-600 capitalize w-16">{device.toLowerCase()}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Reading Depth</h3>
                    <div className="space-y-3">
                      {Object.entries(data.scrollDistribution).map(([bucket, count]) => {
                        const total = Object.values(data.scrollDistribution).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                          <div key={bucket} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-20">{bucket}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data && activeTab === 'traffic' && (
              <div className="space-y-6">
                {/* Referrers */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Traffic Sources</h3>
                  {data.referrers.length > 0 ? (
                    <div className="space-y-3">
                      {data.referrers.map((ref) => (
                        <ProgressBar
                          key={ref.domain}
                          label={ref.domain}
                          value={ref.count}
                          max={maxReferrerCount}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No referrer data</p>
                  )}
                </div>

                {/* Next Pages */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    <ArrowRight className="w-4 h-4 inline mr-2" />
                    Where Readers Went Next
                  </h3>
                  {data.nextPages.length > 0 ? (
                    <div className="space-y-2">
                      {data.nextPages.map((page) => (
                        <div key={page.path} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-gray-700 truncate max-w-md">{page.path}</span>
                          <span className="text-sm font-medium text-gray-900">{page.count} readers</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No navigation data (most readers left the site)</p>
                  )}
                </div>
              </div>
            )}

            {data && activeTab === 'engagement' && (
              <div className="space-y-6">
                {/* Link Clicks */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    <Link2 className="w-4 h-4 inline mr-2" />
                    Link Clicks ({data.overview.linkClicks} total)
                  </h3>
                  {data.linkClicks.length > 0 ? (
                    <div className="space-y-3">
                      {data.linkClicks.map((link, idx) => (
                        <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0 gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{link.text || 'No text'}</p>
                            <p className="text-xs text-gray-500 truncate">{link.url}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                              link.type === 'external' ? 'bg-orange-100 text-orange-700' :
                              link.type === 'internal' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {link.type}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-primary-600">{link.count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No link clicks recorded</p>
                  )}
                </div>

                {/* Shares */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Share2 className="w-4 h-4 inline mr-2" />
                    Shares
                  </h3>
                  <p className="text-3xl font-bold text-primary-600">{data.overview.shares}</p>
                  <p className="text-sm text-gray-500">times shared</p>
                </div>

                {/* Time Distribution */}
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Time Spent Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(data.durationDistribution).map(([bucket, count]) => {
                      const total = Object.values(data.durationDistribution).reduce((a, b) => a + b, 0)
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      return (
                        <div key={bucket} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-16">{bucket}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{count} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {data && activeTab === 'activity' && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Recent Readers (Last 50)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scroll</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.recentViews.map((view, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(view.enteredAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDuration(view.duration || 0)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{view.scrollDepth}%</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              view.engaged ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {view.engaged ? 'Engaged' : 'Bounced'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{view.referrerDomain || 'Direct'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <DeviceIcon device={view.deviceType} />
                              <span className="capitalize">{view.deviceType.toLowerCase()}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {data.recentViews.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No recent activity
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
