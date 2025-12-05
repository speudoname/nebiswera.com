'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button, IconBadge } from '@/components/ui'
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Award,
  ArrowRight,
  GraduationCap,
} from 'lucide-react'

interface EnrolledCourse {
  enrollmentId: string
  enrolledAt: string
  completedAt: string | null
  status: string
  expiresAt: string | null
  certificateUrl: string | null
  certificateIssuedAt: string | null
  course: {
    id: string
    slug: string
    title: string
    description: string | null
    thumbnail: string | null
    locale: string
    accessType: string
  }
  progress: {
    percent: number
    completedParts: number
    totalParts: number
    lastAccessedAt: string
    lastAccessedPartId: string | null
    resumePartId: string | null
  }
}

export function MyCourses() {
  const t = useTranslations('profile')
  const locale = useLocale()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/profile/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data.data?.courses || [])
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  if (loading) {
    return (
      <Card className="mb-4 md:mb-6">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-neu-dark/20">
          <h3 className="no-margin flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            {t('myCourses')}
          </h3>
        </div>
        <div className="px-4 md:px-6 py-8 flex justify-center">
          <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
        </div>
      </Card>
    )
  }

  if (courses.length === 0) {
    return (
      <Card className="mb-4 md:mb-6">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-neu-dark/20">
          <h3 className="no-margin flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            {t('myCourses')}
          </h3>
        </div>
        <div className="px-4 md:px-6 py-8 text-center">
          <div className="mb-4">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          </div>
          <p className="text-gray-500 mb-4">{t('noCoursesYet')}</p>
          <Link href={`/${locale}/courses`}>
            <Button variant="primary" size="sm">
              {t('browseCourses')}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // Separate in-progress and completed courses
  const inProgressCourses = courses.filter((c) => c.progress.percent < 100)
  const completedCourses = courses.filter((c) => c.progress.percent >= 100)

  return (
    <Card className="mb-4 md:mb-6">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-neu-dark/20 flex items-center justify-between">
        <h3 className="no-margin flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-600" />
          {t('myCourses')}
        </h3>
        <Link
          href={`/${locale}/courses`}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          {t('browseCourses')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-6">
        {/* In Progress Courses */}
        {inProgressCourses.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Play className="w-4 h-4" />
              {t('inProgress')} ({inProgressCourses.length})
            </h4>
            <div className="space-y-3">
              {inProgressCourses.map((enrollment) => (
                <CourseProgressCard
                  key={enrollment.enrollmentId}
                  enrollment={enrollment}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {completedCourses.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              {t('completed')} ({completedCourses.length})
            </h4>
            <div className="space-y-3">
              {completedCourses.map((enrollment) => (
                <CourseProgressCard
                  key={enrollment.enrollmentId}
                  enrollment={enrollment}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function CourseProgressCard({
  enrollment,
  locale,
  t,
}: {
  enrollment: EnrolledCourse
  locale: string
  t: ReturnType<typeof useTranslations<'profile'>>
}) {
  const { course, progress } = enrollment
  const isCompleted = progress.percent >= 100

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('today')
    if (diffDays === 1) return t('yesterday')
    if (diffDays < 7) return t('daysAgo', { days: diffDays })
    if (diffDays < 30) return t('weeksAgo', { weeks: Math.floor(diffDays / 7) })
    return date.toLocaleDateString()
  }

  return (
    <div className="flex gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            width={80}
            height={45}
            className="rounded-md object-cover w-20 h-12"
          />
        ) : (
          <div className="w-20 h-12 rounded-md bg-purple-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h5 className="font-medium text-gray-900 truncate text-sm">{course.title}</h5>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(progress.lastAccessedAt)}</span>
              {enrollment.certificateUrl && (
                <>
                  <span className="text-gray-300">|</span>
                  <Award className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-600">{t('certificateEarned')}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Link
            href={`/${locale}/courses/${course.slug}/learn`}
            className="flex-shrink-0"
          >
            <Button variant={isCompleted ? 'secondary' : 'primary'} size="sm">
              {isCompleted ? t('review') : t('continue')}
            </Button>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">
              {progress.completedParts}/{progress.totalParts} {t('partsCompleted')}
            </span>
            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-purple-600'}`}>
              {progress.percent}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCompleted ? 'bg-green-500' : 'bg-purple-600'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
