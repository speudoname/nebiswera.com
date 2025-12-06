'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  Eye,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  MousePointer,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  FileText,
  Chrome,
  Compass,
  Search,
  Link2,
  ArrowUpRight,
  Percent,
  Layers,
  Languages,
  ExternalLink,
  ChevronRight,
  Play,
  Video,
  HardDrive,
  CheckCircle,
  BookOpen,
  Radio,
} from 'lucide-react'
import { BlogPostDetailModal } from './BlogPostDetailModal'
import { VideoDetailModal } from './VideoDetailModal'

type TabType = 'overview' | 'blog' | 'video'

interface AnalyticsData {
  overview: {
    totalPageViews: number
    uniqueVisitors: number
    uniqueSessions: number
    avgDuration: number
    avgScrollDepth: number
    engagementRate: number
    bounceRate: number
  }
  topPages: Array<{
    path: string
    views: number
    avgDuration: number
    avgScrollDepth: number
  }>
  viewsByDay: Array<{
    date: string
    count: number
  }>
  topReferrers: Array<{
    domain: string
    count: number
  }>
  deviceBreakdown: Array<{
    device: string
    count: number
    percentage: number
  }>
  browserBreakdown: Array<{
    browser: string
    count: number
  }>
  pageTypeBreakdown: Array<{
    type: string
    count: number
  }>
  utmCampaigns: Array<{
    campaign: string
    count: number
  }>
  osBreakdown: Array<{
    os: string
    count: number
    percentage: number
  }>
  localeBreakdown: Array<{
    locale: string
    count: number
    percentage: number
  }>
  dateRange: {
    start: string
    end: string
    days: number
  }
}

interface BlogAnalytics {
  overview: {
    totalViews: number
    avgDuration: number
    avgScrollDepth: number
    totalPosts: number
    publishedPosts: number
  }
  posts: Array<{
    id: string
    titleKa: string
    titleEn: string
    slugKa: string
    slugEn: string
    status: string
    publishedAt: string | null
    totalViewCount: number
    periodViews: number
    avgDuration: number
    avgScrollDepth: number
    engagementRate: number
    bounceRate: number
  }>
}

interface VideoAnalytics {
  // From existing /api/admin/video-analytics (Bunny.net inventory)
  videos: Array<{
    videoId: string
    title: string
    thumbnail: string
    hlsUrl: string
    duration: number
    status: string
    dateUploaded: string
    storageSize: number
    bunnyViews: number
    dbViews: number
    uniqueViewers: number
    totalWatchTime: number
    averageWatchPercent: number
    completions: number
    usedIn: Array<{
      type: 'course' | 'webinar'
      id: string
      title: string
      slug?: string
    }>
  }>
  summary: {
    totalVideos: number
    totalStorageBytes: number
    totalDurationSeconds: number
    videosInUse: number
    unusedVideos: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface VideoEventAnalytics {
  // From /api/admin/analytics/video (event-based)
  overview: {
    totalVideoStarts: number
    courseVideoStarts: number
    pageVideoPlays: number
    videoCompletes: number
    completionRate: number
    avgProgress: number
    uniqueViewers: number
  }
  dailyViews: Array<{
    date: string
    count: number
  }>
  recentEvents: Array<{
    type: 'course' | 'page'
    eventType: string
    createdAt: string
    courseId?: string
    courseName?: string
    lessonId?: string
    lessonName?: string
    path?: string
    pageType?: string
    eventData?: unknown
  }>
}

const TIME_RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatVideoDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

function StatCard({
  title,
  value,
  icon: Icon,
  suffix,
  description,
  color = 'primary',
}: {
  title: string
  value: number | string
  icon: React.ElementType
  suffix?: string
  description?: string
  color?: 'primary' | 'green' | 'red' | 'blue' | 'orange' | 'purple'
}) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {suffix && <span className="text-base text-gray-500 ml-1">{suffix}</span>}
      </p>
      <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
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

function BrowserIcon({ browser }: { browser: string }) {
  const b = browser?.toLowerCase() || ''
  if (b.includes('chrome')) return <Chrome className="w-4 h-4" />
  if (b.includes('safari')) return <Compass className="w-4 h-4" />
  if (b.includes('edge')) return <Globe className="w-4 h-4" />
  return <Globe className="w-4 h-4" />
}

function MiniBarChart({ data, height = 120 }: { data: Array<{ date: string; count: number }>; height?: number }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-1 h-full" style={{ height }}>
      {data.map((item, idx) => {
        const barHeight = Math.max((item.count / maxCount) * 100, 2)
        const date = new Date(item.date)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6

        return (
          <div key={idx} className="flex-1 flex flex-col items-center group relative">
            <div
              className={`w-full rounded-t transition-all ${
                isWeekend ? 'bg-primary-300' : 'bg-primary-500'
              } hover:bg-primary-600 cursor-pointer`}
              style={{ height: `${barHeight}%`, minHeight: '2px' }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {item.count} views
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProgressBar({
  value,
  max,
  color = 'primary',
  showLabel = true
}: {
  value: number
  max: number
  color?: string
  showLabel?: boolean
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0

  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClasses[color] || colorClasses.primary}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-10 text-right">{percentage}%</span>
      )}
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function AnalyticsDashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [blogData, setBlogData] = useState<BlogAnalytics | null>(null)
  const [videoData, setVideoData] = useState<VideoAnalytics | null>(null)
  const [videoEventData, setVideoEventData] = useState<VideoEventAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  // Get active tab from URL, default to 'overview'
  const activeTab = (searchParams.get('tab') as TabType) || 'overview'

  // Update URL when tab changes
  const setActiveTab = useCallback((tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, blogRes, videoRes, videoEventRes] = await Promise.all([
        fetch(`/api/admin/analytics?days=${days}`),
        fetch(`/api/admin/analytics/blog?days=${days}`),
        fetch(`/api/admin/video-analytics?limit=50`), // Bunny.net inventory
        fetch(`/api/admin/analytics/video?days=${days}`), // Event-based analytics
      ])

      if (analyticsRes.ok) {
        setData(await analyticsRes.json())
      }
      if (blogRes.ok) {
        setBlogData(await blogRes.json())
      }
      if (videoRes.ok) {
        const result = await videoRes.json()
        setVideoData(result.data) // Note: wrapped in data object
      }
      if (videoEventRes.ok) {
        setVideoEventData(await videoEventRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [days])

  // Calculate totals for progress bars
  const maxReferrerCount = useMemo(() => {
    if (!data?.topReferrers?.length) return 1
    return Math.max(...data.topReferrers.map((r) => r.count))
  }, [data?.topReferrers])

  const maxBrowserCount = useMemo(() => {
    if (!data?.browserBreakdown?.length) return 1
    return Math.max(...data.browserBreakdown.map((b) => b.count))
  }, [data?.browserBreakdown])

  const totalBrowserViews = useMemo(() => {
    if (!data?.browserBreakdown?.length) return 1
    return data.browserBreakdown.reduce((sum, b) => sum + b.count, 0)
  }, [data?.browserBreakdown])

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {data?.dateRange && (
              <>
                {new Date(data.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date(data.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDays(range.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  days === range.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('blog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'blog'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Blog Posts
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'video'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Video className="w-4 h-4" />
          Videos
        </button>
      </div>

      {activeTab === 'overview' && data && (
        <>
          {/* Main Stats Grid - 2 rows of 4 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Page Views"
              value={formatNumber(data.overview.totalPageViews)}
              icon={Eye}
              color="primary"
            />
            <StatCard
              title="Unique Visitors"
              value={formatNumber(data.overview.uniqueVisitors)}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Sessions"
              value={formatNumber(data.overview.uniqueSessions)}
              icon={Layers}
              color="purple"
            />
            <StatCard
              title="Avg. Time on Page"
              value={formatDuration(data.overview.avgDuration)}
              icon={Clock}
              color="green"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Engagement Rate"
              value={data.overview.engagementRate}
              suffix="%"
              icon={TrendingUp}
              color="green"
              description="Scrolled 25%+ or 10s+ on page"
            />
            <StatCard
              title="Bounce Rate"
              value={data.overview.bounceRate}
              suffix="%"
              icon={TrendingDown}
              color="red"
              description="Left without engaging"
            />
            <StatCard
              title="Avg. Scroll Depth"
              value={data.overview.avgScrollDepth}
              suffix="%"
              icon={MousePointer}
              color="orange"
            />
            <StatCard
              title="Views / Visitor"
              value={(data.overview.uniqueVisitors > 0
                ? (data.overview.totalPageViews / data.overview.uniqueVisitors).toFixed(1)
                : '0')}
              icon={ArrowUpRight}
              color="purple"
            />
          </div>

          {/* Views Over Time Chart */}
          {data.viewsByDay && data.viewsByDay.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Page Views Over Time</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-primary-500"></span>
                    Weekday
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-primary-300"></span>
                    Weekend
                  </span>
                </div>
              </div>
              <div className="h-32">
                <MiniBarChart data={data.viewsByDay} height={128} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{new Date(data.viewsByDay[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(data.viewsByDay[data.viewsByDay.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Top Pages - spans 2 columns */}
            <div className="lg:col-span-2">
              <SectionCard title="Top Pages" icon={Eye}>
                <div className="space-y-3">
                  {data.topPages.slice(0, 10).map((page, idx) => (
                    <div
                      key={page.path}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-400 w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate" title={page.path}>
                          {page.path}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{formatDuration(page.avgDuration)} avg</span>
                          <span>{page.avgScrollDepth}% scroll</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{page.views.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">views</p>
                      </div>
                    </div>
                  ))}
                  {data.topPages.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No page views yet</p>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Devices & Languages */}
            <div className="space-y-6">
              <SectionCard title="Devices" icon={Monitor}>
                <div className="space-y-4">
                  {data.deviceBreakdown.map((device) => (
                    <div key={device.device}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DeviceIcon device={device.device} />
                          <span className="text-sm text-gray-700 capitalize">
                            {device.device.toLowerCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {device.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {data.deviceBreakdown.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No data yet</p>
                  )}
                </div>
              </SectionCard>

              {data.localeBreakdown && data.localeBreakdown.length > 0 && (
                <SectionCard title="Languages" icon={Languages}>
                  <div className="space-y-3">
                    {data.localeBreakdown.map((locale) => (
                      <div key={locale.locale} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{locale.locale === 'ka' ? '🇬🇪' : '🇬🇧'}</span>
                          <span className="text-sm text-gray-700">
                            {locale.locale === 'ka' ? 'Georgian' : 'English'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{locale.percentage}%</span>
                          <span className="text-xs text-gray-400">({locale.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          </div>

          {/* Second Row: Browsers, OS, Referrers, Content Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Browsers */}
            <SectionCard title="Browsers" icon={Chrome}>
              <div className="space-y-3">
                {data.browserBreakdown.map((browser) => {
                  const percentage = Math.round((browser.count / totalBrowserViews) * 100)
                  return (
                    <div key={browser.browser}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <BrowserIcon browser={browser.browser} />
                          <span className="text-sm text-gray-700">{browser.browser || 'Unknown'}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{percentage}%</span>
                      </div>
                      <ProgressBar value={browser.count} max={maxBrowserCount} color="blue" showLabel={false} />
                    </div>
                  )
                })}
                {data.browserBreakdown.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data yet</p>
                )}
              </div>
            </SectionCard>

            {/* OS */}
            {data.osBreakdown && data.osBreakdown.length > 0 && (
              <SectionCard title="Operating Systems" icon={Monitor}>
                <div className="space-y-3">
                  {data.osBreakdown.map((os) => (
                    <div key={os.os} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{os.os || 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{os.percentage}%</span>
                        <span className="text-xs text-gray-400">({os.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Top Referrers */}
            <SectionCard title="Top Referrers" icon={Link2}>
              <div className="space-y-3">
                {data.topReferrers.slice(0, 6).map((ref) => (
                  <div key={ref.domain}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate max-w-[140px]" title={ref.domain}>
                        {ref.domain || 'Direct'}
                      </span>
                      <span className="text-xs font-medium text-gray-500">{ref.count}</span>
                    </div>
                    <ProgressBar value={ref.count} max={maxReferrerCount} color="green" showLabel={false} />
                  </div>
                ))}
                {data.topReferrers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No referrer data</p>
                )}
              </div>
            </SectionCard>

            {/* Content Types */}
            <SectionCard title="Content Types" icon={Layers}>
              <div className="space-y-2">
                {data.pageTypeBreakdown.map((pt) => (
                  <div key={pt.type} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">
                      {pt.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || 'Other'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{pt.count}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* UTM Campaigns */}
          {data.utmCampaigns && data.utmCampaigns.length > 0 && (
            <SectionCard title="UTM Campaigns" icon={Search}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.utmCampaigns.map((campaign) => (
                  <div
                    key={campaign.campaign}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-800">{campaign.campaign}</span>
                    <span className="text-sm font-bold text-primary-600">{campaign.count} visits</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {activeTab === 'blog' && blogData && (
        <>
          {/* Blog Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Blog Page Views"
              value={formatNumber(blogData.overview.totalViews)}
              icon={Eye}
              color="primary"
            />
            <StatCard
              title="Published Posts"
              value={blogData.overview.publishedPosts}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Total Posts"
              value={blogData.overview.totalPosts}
              icon={Layers}
              color="purple"
            />
            <StatCard
              title="Avg. Read Time"
              value={formatDuration(blogData.overview.avgDuration)}
              icon={Clock}
              color="green"
            />
            <StatCard
              title="Avg. Scroll Depth"
              value={blogData.overview.avgScrollDepth}
              suffix="%"
              icon={Percent}
              color="orange"
            />
          </div>

          {/* Blog Posts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Blog Post Performance</h3>
              <p className="text-sm text-gray-500 mt-1">Click a row for detailed analytics</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      URL
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      All-time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Period
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Avg. Time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Engaged
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bounced
                    </th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blogData.posts.map((post) => (
                    <tr
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className="hover:bg-primary-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {post.titleKa || post.titleEn}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/blog/${post.slugKa || post.slugEn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          /blog/{post.slugKa || post.slugEn}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {post.totalViewCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-700">
                          {post.periodViews.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {formatDuration(post.avgDuration)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          post.engagementRate >= 50 ? 'text-green-600' :
                          post.engagementRate >= 25 ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          {post.engagementRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          post.bounceRate <= 30 ? 'text-green-600' :
                          post.bounceRate <= 50 ? 'text-yellow-600' : 'text-red-500'
                        }`}>
                          {post.bounceRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </td>
                    </tr>
                  ))}
                  {blogData.posts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No blog posts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'video' && (videoData || videoEventData) && (
        <>
          {/* Video Library Stats (from Bunny.net) */}
          {videoData?.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatCard
                title="Total Videos"
                value={formatNumber(videoData.summary.totalVideos)}
                icon={Video}
                color="primary"
              />
              <StatCard
                title="Total Storage"
                value={formatBytes(videoData.summary.totalStorageBytes)}
                icon={HardDrive}
                color="blue"
              />
              <StatCard
                title="Total Duration"
                value={formatVideoDuration(videoData.summary.totalDurationSeconds)}
                icon={Clock}
                color="green"
              />
              <StatCard
                title="In Use"
                value={videoData.summary.videosInUse}
                icon={CheckCircle}
                color="orange"
              />
              <StatCard
                title="Unused"
                value={videoData.summary.unusedVideos}
                icon={Layers}
                color="red"
              />
            </div>
          )}

          {/* Event-based Stats (user behavior) */}
          {videoEventData?.overview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Video Plays"
                value={formatNumber(videoEventData.overview.totalVideoStarts)}
                icon={Play}
                color="primary"
                description={`${days} day period`}
              />
              <StatCard
                title="Completions"
                value={formatNumber(videoEventData.overview.videoCompletes)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Completion Rate"
                value={videoEventData.overview.completionRate}
                suffix="%"
                icon={Percent}
                color="orange"
              />
              <StatCard
                title="Unique Viewers"
                value={formatNumber(videoEventData.overview.uniqueViewers)}
                icon={Users}
                color="purple"
              />
            </div>
          )}

          {/* Video Plays Over Time */}
          {videoEventData?.dailyViews && videoEventData.dailyViews.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Video Plays Over Time</h3>
              </div>
              <div className="h-32">
                <MiniBarChart data={videoEventData.dailyViews} height={128} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{new Date(videoEventData.dailyViews[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(videoEventData.dailyViews[videoEventData.dailyViews.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          )}

          {/* Video Library Table */}
          {videoData?.videos && videoData.videos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Video Library</h3>
                <p className="text-sm text-gray-500 mt-1">Click a row for detailed analytics</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Video
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Used In
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {videoData.videos.slice(0, 15).map((video) => (
                      <tr
                        key={video.videoId}
                        onClick={() => setSelectedVideoId(video.videoId)}
                        className="hover:bg-primary-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {video.thumbnail ? (
                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Video className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {video.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            video.status === 'ready' ? 'bg-green-100 text-green-700' :
                            video.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {video.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {formatVideoDuration(video.duration)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {video.bunnyViews + video.dbViews}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {video.usedIn.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {video.usedIn.slice(0, 2).map((usage, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                    usage.type === 'course'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}
                                >
                                  {usage.type === 'course' ? <BookOpen className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                                  {usage.title.length > 15 ? usage.title.substring(0, 15) + '...' : usage.title}
                                </span>
                              ))}
                              {video.usedIn.length > 2 && (
                                <span className="text-xs text-gray-500">+{video.usedIn.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not used</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {videoData.pagination.total > 15 && (
                <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500 text-center">
                  Showing 15 of {videoData.pagination.total} videos
                </div>
              )}
            </div>
          )}

          {/* Recent Video Events */}
          {videoEventData?.recentEvents && videoEventData.recentEvents.length > 0 && (
            <SectionCard title="Recent Video Events" icon={Clock}>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {videoEventData.recentEvents.slice(0, 15).map((event, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      event.eventType.includes('COMPLETED') || event.eventType.includes('COMPLETE')
                        ? 'bg-green-100 text-green-700'
                        : event.eventType.includes('STARTED') || event.eventType.includes('PLAY')
                        ? 'bg-blue-100 text-blue-700'
                        : event.eventType.includes('PAUSED') || event.eventType.includes('PAUSE')
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-600 truncate flex-1">
                      {event.type === 'course' ? event.lessonName || event.courseName : event.path}
                    </span>
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {activeTab === 'video' && !videoData && !videoEventData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No video analytics data available</p>
          <p className="text-sm text-gray-400 mt-1">Video events will appear here once users start watching videos</p>
        </div>
      )}

      {/* Blog Post Detail Modal */}
      {selectedPostId && (
        <BlogPostDetailModal
          postId={selectedPostId}
          days={days}
          onClose={() => setSelectedPostId(null)}
        />
      )}

      {/* Video Detail Modal */}
      {selectedVideoId && (
        <VideoDetailModal
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </div>
  )
}

export default function AnalyticsDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>}>
      <AnalyticsDashboardContent />
    </Suspense>
  )
}
