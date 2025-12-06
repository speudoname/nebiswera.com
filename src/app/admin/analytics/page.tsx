'use client'

import { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'

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

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [blogData, setBlogData] = useState<BlogAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'overview' | 'blog'>('overview')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, blogRes] = await Promise.all([
        fetch(`/api/admin/analytics?days=${days}`),
        fetch(`/api/admin/analytics/blog?days=${days}`),
      ])

      if (analyticsRes.ok) {
        setData(await analyticsRes.json())
      }
      if (blogRes.ok) {
        setBlogData(await blogRes.json())
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
              <p className="text-sm text-gray-500 mt-1">Showing analytics for the selected time period</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Post
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
                      Scroll
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Engaged
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bounced
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blogData.posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {post.titleKa || post.titleEn}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">/{post.slugKa || post.slugEn}</p>
                        </div>
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
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {post.avgScrollDepth}%
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
                    </tr>
                  ))}
                  {blogData.posts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
    </div>
  )
}
