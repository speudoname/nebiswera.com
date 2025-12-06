'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Video,
  Eye,
  Clock,
  Users,
  CheckCircle,
  PlayCircle,
  BarChart3,
  BookOpen,
  Radio,
  ExternalLink,
  Loader2,
  User,
  Percent,
  TrendingUp,
} from 'lucide-react'

interface VideoDetail {
  video: {
    id: string
    title: string
    thumbnail: string
    hlsUrl: string
    duration: number
    status: string
    dateUploaded: string
    encodeProgress: number
  }
  bunnyStats: {
    views: number
    watchTime: number
    averageWatchTime: number
  }
  usage: {
    courses: {
      courseId: string
      courseTitle: string
      courseSlug: string
      moduleTitle?: string
      lessonTitle: string
      partId: string
      partTitle: string
    }[]
    webinars: {
      id: string
      title: string
      slug: string
    }[]
  }
  courseAnalytics: {
    totalViews: number
    uniqueViewers: number
    registeredViewers: number
    anonymousViewers: number
    completions: number
    completionRate: number
    averageProgress: number
    viewers: {
      id: string
      name: string | null
      email: string | null
      image: string | null
      isAnonymous: boolean
      viewCount: number
      lastWatched: string
      maxProgress: number
      totalWatchTime: number
      completed: boolean
    }[]
  }
  webinarAnalytics?: {
    webinars: { id: string; title: string; slug: string }[]
    totalRegistrations: number
    totalWatchTimeSeconds: number
    completions: number
    averageWatchTime: number
    topViewers: {
      id: string
      name: string
      email: string
      watchTimeSeconds: number
      maxPosition: number
      completed: boolean
      engagementScore: number
    }[]
  }
}

interface Props {
  videoId: string
  onClose: () => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.round(seconds % 60)
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`
  }
  return `${mins}m ${secs}s`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = 'gray',
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color?: string
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Retention chart - shows drop-off at different points
function RetentionChart({ viewers }: { viewers: VideoDetail['courseAnalytics']['viewers'] }) {
  // Create retention buckets (0-10%, 10-25%, 25-50%, 50-75%, 75-90%, 90-100%)
  const buckets = [
    { label: '0-10%', min: 0, max: 10, count: 0 },
    { label: '10-25%', min: 10, max: 25, count: 0 },
    { label: '25-50%', min: 25, max: 50, count: 0 },
    { label: '50-75%', min: 50, max: 75, count: 0 },
    { label: '75-90%', min: 75, max: 90, count: 0 },
    { label: '90-100%', min: 90, max: 100, count: 0 },
  ]

  for (const viewer of viewers) {
    for (const bucket of buckets) {
      if (viewer.maxProgress >= bucket.min && viewer.maxProgress < bucket.max) {
        bucket.count++
        break
      }
      if (viewer.maxProgress >= 100 && bucket.max === 100) {
        bucket.count++
        break
      }
    }
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Viewer Retention (Drop-off Points)</h4>
      <div className="flex items-end gap-2 h-24">
        {buckets.map((bucket) => {
          const height = (bucket.count / maxCount) * 100
          return (
            <div key={bucket.label} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${bucket.count} viewers`}
              />
              <span className="text-xs text-gray-500 mt-1">{bucket.label}</span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Shows how many viewers dropped off at each progress point
      </p>
    </div>
  )
}

export function VideoDetailModal({ videoId, onClose }: Props) {
  const [data, setData] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'viewers' | 'usage'>('overview')

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/video-analytics/${videoId}`)
        if (!response.ok) throw new Error('Failed to fetch video details')
        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video')
      } finally {
        setLoading(false)
      }
    }

    fetchVideoDetails()
  }, [videoId])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-16">
        <div className="relative bg-gray-50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-start justify-between">
            <div className="flex items-start gap-4">
              {data?.video.thumbnail && (
                <div className="w-24 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={data.video.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {data?.video.title || 'Video Analytics'}
                </h2>
                {data && (
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(data.video.duration)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      data.video.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {data.video.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            )}

            {error && (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {data && !loading && (
              <div className="p-6">
                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                  {(['overview', 'viewers', 'usage'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        title="Total Views"
                        value={(data.bunnyStats?.views || 0) + (data.courseAnalytics?.totalViews || 0)}
                        icon={Eye}
                        color="blue"
                      />
                      <StatCard
                        title="Unique Viewers"
                        value={data.courseAnalytics?.uniqueViewers || 0}
                        icon={Users}
                        color="purple"
                      />
                      <StatCard
                        title="Completions"
                        value={data.courseAnalytics?.completions || 0}
                        icon={CheckCircle}
                        color="green"
                      />
                      <StatCard
                        title="Completion Rate"
                        value={`${data.courseAnalytics?.completionRate || 0}%`}
                        icon={Percent}
                        color="orange"
                      />
                    </div>

                    {/* Progress Stats */}
                    <div className="bg-white rounded-xl border p-5">
                      <h3 className="font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <ProgressBar
                            value={data.courseAnalytics?.averageProgress || 0}
                            label="Average Watch Progress"
                          />
                        </div>
                        <div>
                          <ProgressBar
                            value={data.courseAnalytics?.completionRate || 0}
                            label="Completion Rate"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Registered Viewers</p>
                          <p className="text-lg font-semibold">{data.courseAnalytics?.registeredViewers || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Anonymous Viewers</p>
                          <p className="text-lg font-semibold">{data.courseAnalytics?.anonymousViewers || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Watch Time (Bunny)</p>
                          <p className="text-lg font-semibold">{formatDuration(data.bunnyStats?.averageWatchTime || 0)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Retention Chart */}
                    {data.courseAnalytics?.viewers && data.courseAnalytics.viewers.length > 0 && (
                      <div className="bg-white rounded-xl border p-5">
                        <RetentionChart viewers={data.courseAnalytics.viewers} />
                      </div>
                    )}

                    {/* Webinar Analytics */}
                    {data.webinarAnalytics && (
                      <div className="bg-white rounded-xl border p-5">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Radio className="w-4 h-4" />
                          Webinar Analytics
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Registrations</p>
                            <p className="text-lg font-semibold">{data.webinarAnalytics.totalRegistrations}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Watch Time</p>
                            <p className="text-lg font-semibold">{formatDuration(data.webinarAnalytics.totalWatchTimeSeconds)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Completions</p>
                            <p className="text-lg font-semibold">{data.webinarAnalytics.completions}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg Watch Time</p>
                            <p className="text-lg font-semibold">{formatDuration(data.webinarAnalytics.averageWatchTime)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Viewers Tab */}
                {activeTab === 'viewers' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border overflow-hidden">
                      <div className="px-5 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-900">
                          Recent Viewers ({data.courseAnalytics?.viewers?.length || 0})
                        </h3>
                      </div>
                      <div className="divide-y max-h-96 overflow-y-auto">
                        {data.courseAnalytics?.viewers?.map((viewer) => (
                          <div key={viewer.id} className="px-5 py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {viewer.image ? (
                                <img src={viewer.image} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {viewer.name || viewer.email || (viewer.isAnonymous ? 'Anonymous' : 'Unknown')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {viewer.viewCount} view{viewer.viewCount !== 1 ? 's' : ''} · Last watched {formatDateTime(viewer.lastWatched)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <div className="w-20">
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${viewer.completed ? 'bg-green-500' : 'bg-primary-500'}`}
                                      style={{ width: `${viewer.maxProgress}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm font-medium w-12 text-right">
                                  {viewer.maxProgress}%
                                </span>
                                {viewer.completed && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!data.courseAnalytics?.viewers || data.courseAnalytics.viewers.length === 0) && (
                          <div className="px-5 py-12 text-center text-gray-500">
                            No viewer data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Webinar Viewers */}
                    {data.webinarAnalytics?.topViewers && data.webinarAnalytics.topViewers.length > 0 && (
                      <div className="bg-white rounded-xl border overflow-hidden">
                        <div className="px-5 py-3 border-b bg-gray-50">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Radio className="w-4 h-4" />
                            Webinar Viewers
                          </h3>
                        </div>
                        <div className="divide-y">
                          {data.webinarAnalytics.topViewers.map((viewer) => (
                            <div key={viewer.id} className="px-5 py-3 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{viewer.name}</p>
                                <p className="text-sm text-gray-500">{viewer.email}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-medium">{formatDuration(viewer.watchTimeSeconds)}</p>
                                <p className="text-xs text-gray-500">
                                  Score: {viewer.engagementScore}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Usage Tab */}
                {activeTab === 'usage' && (
                  <div className="space-y-4">
                    {/* Courses */}
                    <div className="bg-white rounded-xl border overflow-hidden">
                      <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          Used in Courses ({data.usage?.courses?.length || 0})
                        </h3>
                      </div>
                      <div className="divide-y">
                        {data.usage?.courses?.map((course, idx) => (
                          <div key={idx} className="px-5 py-3">
                            <p className="font-medium text-gray-900">{course.courseTitle}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {course.moduleTitle && `${course.moduleTitle} → `}
                              {course.lessonTitle} → {course.partTitle}
                            </p>
                          </div>
                        ))}
                        {(!data.usage?.courses || data.usage.courses.length === 0) && (
                          <div className="px-5 py-8 text-center text-gray-500">
                            Not used in any courses
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Webinars */}
                    <div className="bg-white rounded-xl border overflow-hidden">
                      <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">
                          Used in Webinars ({data.usage?.webinars?.length || 0})
                        </h3>
                      </div>
                      <div className="divide-y">
                        {data.usage?.webinars?.map((webinar) => (
                          <div key={webinar.id} className="px-5 py-3 flex items-center justify-between">
                            <p className="font-medium text-gray-900">{webinar.title}</p>
                            <a
                              href={`/webinar/${webinar.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                        {(!data.usage?.webinars || data.usage.webinars.length === 0) && (
                          <div className="px-5 py-8 text-center text-gray-500">
                            Not used in any webinars
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="bg-white rounded-xl border p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Video Information</h3>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-gray-500">Video ID</dt>
                          <dd className="font-mono text-gray-900">{data.video.id}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Uploaded</dt>
                          <dd className="text-gray-900">{formatDate(data.video.dateUploaded)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Duration</dt>
                          <dd className="text-gray-900">{formatDuration(data.video.duration)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Status</dt>
                          <dd className="text-gray-900 capitalize">{data.video.status}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 pt-4 border-t">
                        <a
                          href={data.video.hlsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Watch Video
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
