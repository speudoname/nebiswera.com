'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
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
  Calendar,
  Percent,
} from 'lucide-react'
import { formatDuration } from '@/lib'

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

export default function VideoDetailPage({ params }: { params: { videoId: string } }) {
  const { videoId } = params
  const [data, setData] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Link href="/admin/videos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Videos
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || 'Video not found'}</p>
        </div>
      </div>
    )
  }

  const totalViews = (data.bunnyStats?.views || 0) + (data.courseAnalytics?.totalViews || 0)
  const totalViewers = (data.courseAnalytics?.uniqueViewers || 0) + (data.webinarAnalytics?.totalRegistrations || 0)

  return (
    <div className="p-6">
      {/* Back Link */}
      <Link href="/admin/videos" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Videos
      </Link>

      {/* Video Header */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail */}
          <div className="relative w-full md:w-80 aspect-video rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {data.video.thumbnail ? (
              <Image
                src={data.video.thumbnail}
                alt={data.video.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <a
              href={data.video.hlsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
            >
              <PlayCircle className="w-16 h-16 text-white" />
            </a>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.video.title}</h1>
            <p className="text-gray-500 font-mono text-sm mb-4">{data.video.id}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize flex items-center gap-1.5">
                  {data.video.status === 'ready' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                  )}
                  {data.video.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{formatDuration(data.video.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Uploaded</p>
                <p className="font-medium">{formatDate(data.video.dateUploaded)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="font-medium">{totalViews}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold">{totalViews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Viewers</p>
              <p className="text-2xl font-bold">{totalViewers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completions</p>
              <p className="text-2xl font-bold">
                {(data.courseAnalytics?.completions || 0) + (data.webinarAnalytics?.completions || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Percent className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Progress</p>
              <p className="text-2xl font-bold">{data.courseAnalytics?.averageProgress || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Section */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Where This Video Is Used
          </h2>

          {data.usage.courses.length === 0 && data.usage.webinars.length === 0 ? (
            <p className="text-gray-500">This video is not currently used anywhere.</p>
          ) : (
            <div className="space-y-4">
              {/* Courses */}
              {data.usage.courses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Courses
                  </h3>
                  <div className="space-y-2">
                    {data.usage.courses.map((course, i) => (
                      <Link
                        key={i}
                        href={`/admin/courses/${course.courseId}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="font-medium">{course.courseTitle}</p>
                        <p className="text-sm text-gray-500">
                          {course.moduleTitle && `${course.moduleTitle} → `}
                          {course.lessonTitle} → {course.partTitle}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Webinars */}
              {data.usage.webinars.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Radio className="w-4 h-4" />
                    Webinars
                  </h3>
                  <div className="space-y-2">
                    {data.usage.webinars.map((webinar) => (
                      <Link
                        key={webinar.id}
                        href={`/admin/webinars/${webinar.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="font-medium">{webinar.title}</p>
                        <p className="text-sm text-gray-500">/{webinar.slug}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Viewers Section */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Viewers
          </h2>

          {data.courseAnalytics?.viewers.length === 0 && !data.webinarAnalytics?.topViewers.length ? (
            <p className="text-gray-500">No viewer data available yet.</p>
          ) : (
            <div className="space-y-3">
              {/* Course Viewers */}
              {data.courseAnalytics?.viewers.slice(0, 5).map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {viewer.image ? (
                      <Image
                        src={viewer.image}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {viewer.name || (viewer.isAnonymous ? 'Anonymous' : viewer.email)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {viewer.maxProgress}% watched • {viewer.viewCount} views
                    </p>
                  </div>
                  {viewer.completed && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}

              {/* Webinar Viewers */}
              {data.webinarAnalytics?.topViewers.slice(0, 5).map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Radio className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{viewer.name || viewer.email}</p>
                    <p className="text-sm text-gray-500">
                      {formatDuration(viewer.watchTimeSeconds)} watched • Score: {viewer.engagementScore}
                    </p>
                  </div>
                  {viewer.completed && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bunny Stats */}
      {data.bunnyStats && (data.bunnyStats.views > 0 || data.bunnyStats.watchTime > 0) && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Bunny.net Statistics
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Views (Bunny)</p>
              <p className="text-xl font-bold">{data.bunnyStats.views}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Watch Time</p>
              <p className="text-xl font-bold">{formatDuration(data.bunnyStats.watchTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Watch Time</p>
              <p className="text-xl font-bold">{formatDuration(data.bunnyStats.averageWatchTime)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
