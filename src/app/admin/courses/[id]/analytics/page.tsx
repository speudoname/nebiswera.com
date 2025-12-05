'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import {
  ArrowLeft,
  Loader2,
  BarChart3,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  HelpCircle,
  Activity,
  RefreshCw,
  Calendar,
  ChevronDown,
} from 'lucide-react'

interface OverviewStats {
  totalEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  completionRate: number
  totalViews: number
  avgCompletionDays: number
  completionsCount: number
  progressDistribution: {
    label: string
    count: number
    percentage: number
  }[]
  quizzes: {
    total: number
    overallPassRate: number
    totalAttempts: number
  }
}

interface TrendData {
  date: string
  count: number
}

interface EngagementData {
  order: number
  partId: string
  title: string
  type: string
  lessonTitle: string
  moduleTitle?: string
  completions: number
  completionRate: number
}

interface QuizData {
  quizId: string
  title: string
  lessonTitle: string
  totalAttempts: number
  passedAttempts: number
  passRate: number
  averageScore: number
  passingScore: number
}

interface ActivityData {
  id: string
  eventType: string
  eventData: Record<string, unknown>
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  anonymousId: string | null
}

interface TopStudent {
  enrollmentId: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  progressPercent: number
  status: string
  enrolledAt: string
  completedAt: string | null
}

interface Course {
  id: string
  title: string
}

export default function CourseAnalyticsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Analytics data
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [enrollmentTrends, setEnrollmentTrends] = useState<TrendData[]>([])
  const [completionTrends, setCompletionTrends] = useState<TrendData[]>([])
  const [engagement, setEngagement] = useState<EngagementData[]>([])
  const [quizzes, setQuizzes] = useState<QuizData[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([])
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])

  useEffect(() => {
    fetchData()
  }, [id, period])

  const fetchData = async () => {
    try {
      // Fetch course info
      const courseRes = await fetch(`/api/admin/courses/${id}`)
      if (!courseRes.ok) {
        router.push('/admin/courses')
        return
      }
      const courseData = await courseRes.json()
      setCourse({ id: courseData.id, title: courseData.title })

      // Fetch full analytics
      const analyticsRes = await fetch(
        `/api/admin/courses/${id}/analytics?view=full&period=${period}`
      )
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setStats(data.stats)
        setEnrollmentTrends(data.trends?.enrollments || [])
        setCompletionTrends(data.trends?.completions || [])
        setEngagement(data.engagement || [])
        setQuizzes(data.quizzes || [])
        setRecentActivity(data.recentActivity || [])
        setTopStudents(data.topStudents || [])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${id}`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              Analytics
            </h1>
            <p className="text-text-muted mt-1">{course.title}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Enrollments"
            value={stats.totalEnrollments}
            color="text-blue-500"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={Activity}
            label="Active Students"
            value={stats.activeEnrollments}
            color="text-green-500"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={Trophy}
            label="Completions"
            value={stats.completedEnrollments}
            subValue={`${stats.completionRate}% rate`}
            color="text-amber-500"
            bgColor="bg-amber-50"
          />
          <StatCard
            icon={Clock}
            label="Avg. Completion Time"
            value={`${stats.avgCompletionDays}d`}
            subValue={`${stats.completionsCount} completions`}
            color="text-purple-500"
            bgColor="bg-purple-50"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Progress Distribution */}
        {stats && (
          <Card variant="raised" padding="lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              Progress Distribution
            </h3>
            <div className="space-y-3">
              {stats.progressDistribution.map((bucket) => (
                <div key={bucket.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{bucket.label}</span>
                    <span className="font-medium">{bucket.count} students ({bucket.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quiz Performance */}
        {stats && stats.quizzes.total > 0 && (
          <Card variant="raised" padding="lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              Quiz Performance
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">
                  {stats.quizzes.total}
                </div>
                <div className="text-xs text-text-muted">Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.quizzes.overallPassRate}%
                </div>
                <div className="text-xs text-text-muted">Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">
                  {stats.quizzes.totalAttempts}
                </div>
                <div className="text-xs text-text-muted">Attempts</div>
              </div>
            </div>
            {quizzes.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                {quizzes.slice(0, 5).map((quiz) => (
                  <div key={quiz.quizId} className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary truncate flex-1">{quiz.title}</span>
                    <span className={`font-medium ml-2 ${quiz.passRate >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                      {quiz.passRate}% pass
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Enrollment Trends */}
      {enrollmentTrends.length > 0 && (
        <Card variant="raised" padding="lg" className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Enrollment Trends
          </h3>
          <div className="h-48">
            <SimpleBarChart data={enrollmentTrends} color="bg-blue-500" />
          </div>
        </Card>
      )}

      {/* Content Engagement (Drop-off Analysis) */}
      {engagement.length > 0 && (
        <Card variant="raised" padding="lg" className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            Content Engagement (Drop-off Analysis)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Content</th>
                  <th className="text-left py-2 px-2">Lesson</th>
                  <th className="text-right py-2 px-2">Completions</th>
                  <th className="text-right py-2 px-2">Rate</th>
                  <th className="py-2 px-2 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {engagement.slice(0, 15).map((item) => (
                  <tr key={item.partId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-text-muted">{item.order}</td>
                    <td className="py-2 px-2">
                      <span className="font-medium">{item.title}</span>
                      <span className="ml-2 text-xs text-text-muted capitalize">
                        ({item.type.toLowerCase()})
                      </span>
                    </td>
                    <td className="py-2 px-2 text-text-secondary">{item.lessonTitle}</td>
                    <td className="py-2 px-2 text-right">{item.completions}</td>
                    <td className="py-2 px-2 text-right font-medium">{item.completionRate}%</td>
                    <td className="py-2 px-2">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.completionRate >= 70 ? 'bg-green-500' :
                            item.completionRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        {topStudents.length > 0 && (
          <Card variant="raised" padding="lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary-600" />
              Top Students
            </h3>
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div key={student.enrollmentId} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-gray-200 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary truncate">
                      {student.user.name || student.user.email}
                    </div>
                    <div className="text-xs text-text-muted">
                      {student.status === 'COMPLETED' ? 'Completed' : `${student.progressPercent}% progress`}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    student.status === 'COMPLETED' ? 'text-green-600' : 'text-text-secondary'
                  }`}>
                    {student.progressPercent}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card variant="raised" padding="lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary">
                      <span className="font-medium">
                        {activity.user?.name || activity.user?.email || 'Anonymous'}
                      </span>
                      {' '}
                      <span className="text-text-secondary">
                        {formatEventType(activity.eventType)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatRelativeTime(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bgColor,
}: {
  icon: typeof Users
  label: string
  value: string | number
  subValue?: string
  color: string
  bgColor: string
}) {
  return (
    <Card variant="raised" padding="md">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-text-primary">{value}</div>
          <div className="text-sm text-text-muted">{label}</div>
          {subValue && (
            <div className="text-xs text-text-secondary mt-1">{subValue}</div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Simple Bar Chart Component
function SimpleBarChart({
  data,
  color,
}: {
  data: TrendData[]
  color: string
}) {
  if (data.length === 0) return <div className="text-text-muted text-center py-8">No data</div>

  const maxValue = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end justify-between h-full gap-1">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="w-full flex-1 flex items-end">
            <div
              className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
              style={{ height: `${(item.count / maxValue) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
              title={`${item.date}: ${item.count}`}
            />
          </div>
          {data.length <= 14 && (
            <div className="text-xs text-text-muted mt-1 truncate w-full text-center">
              {item.date.split('-').slice(1).join('/')}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Helper functions
function formatEventType(eventType: string): string {
  const map: Record<string, string> = {
    ENROLLED: 'enrolled in the course',
    COURSE_VIEWED: 'viewed the course',
    PART_VIEWED: 'viewed content',
    VIDEO_STARTED: 'started a video',
    VIDEO_COMPLETED: 'completed a video',
    PART_COMPLETED: 'completed a part',
    LESSON_COMPLETED: 'completed a lesson',
    COURSE_COMPLETED: 'completed the course',
    QUIZ_STARTED: 'started a quiz',
    QUIZ_PASSED: 'passed a quiz',
    QUIZ_FAILED: 'failed a quiz',
  }
  return map[eventType] || eventType.toLowerCase().replace(/_/g, ' ')
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
