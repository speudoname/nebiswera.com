'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, ArrowRight, Loader2 } from 'lucide-react'
import { usePixel } from '@/hooks/usePixel'
import { generateEventId } from '@/lib/pixel/utils'

interface EnrollButtonProps {
  courseId: string
  courseSlug: string
  courseTitle?: string
  accessType: 'OPEN' | 'FREE' | 'PAID'
  price: number | null
  currency: string | null
  isEnrolled: boolean
  enrollmentProgress: number
  isLoggedIn: boolean
  locale: string
  variant?: 'default' | 'light'
}

export function EnrollButton({
  courseId,
  courseSlug,
  courseTitle,
  accessType,
  price,
  currency,
  isEnrolled,
  enrollmentProgress,
  isLoggedIn,
  locale,
  variant = 'default',
}: EnrollButtonProps) {
  const router = useRouter()
  const { trackCompleteRegistration } = usePixel({ pageType: 'lms-course' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isKa = locale === 'ka'

  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all'
  const primaryClasses =
    variant === 'light'
      ? 'bg-white text-primary-600 hover:bg-primary-50'
      : 'bg-primary-600 text-white hover:bg-primary-700'
  const secondaryClasses =
    variant === 'light'
      ? 'bg-primary-500/20 text-white hover:bg-primary-500/30'
      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'

  // If already enrolled, show continue button
  if (isEnrolled) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/courses/${courseSlug}/learn`} className={`${baseClasses} ${primaryClasses}`}>
          <Play className="w-5 h-5" />
          {enrollmentProgress > 0
            ? isKa
              ? 'გაგრძელება'
              : 'Continue'
            : isKa
              ? 'სწავლის დაწყება'
              : 'Start Learning'}
        </Link>
        {enrollmentProgress > 0 && (
          <div className={`${baseClasses} ${secondaryClasses}`}>
            {enrollmentProgress}% {isKa ? 'დასრულებული' : 'complete'}
          </div>
        )}
      </div>
    )
  }

  // For OPEN courses, just link to the player
  if (accessType === 'OPEN') {
    return (
      <Link href={`/courses/${courseSlug}/learn`} className={`${baseClasses} ${primaryClasses}`}>
        <Play className="w-5 h-5" />
        {isKa ? 'სწავლის დაწყება' : 'Start Learning'}
      </Link>
    )
  }

  // For FREE/PAID courses, need to be logged in
  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=/${locale}/courses/${courseSlug}`}
        className={`${baseClasses} ${primaryClasses}`}
      >
        {isKa ? 'შესვლა დასარეგისტრირებლად' : 'Sign in to enroll'}
        <ArrowRight className="w-5 h-5" />
      </Link>
    )
  }

  // Handle enrollment
  const handleEnroll = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/courses/${courseSlug}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enroll')
      }

      // Track CompleteRegistration for course enrollment with explicit eventId for deduplication
      const eventId = generateEventId('CompleteRegistration')
      await trackCompleteRegistration(
        {
          content_name: courseTitle || 'Course Enrollment',
          content_category: 'Course',
          content_ids: [courseId],
          content_type: 'course',
          course_id: courseId,
          course_name: courseTitle,
          status: 'enrolled',
        },
        undefined, // no user data (user is authenticated)
        eventId
      )

      // Redirect to the course player
      router.push(`/courses/${courseSlug}/learn`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  // For PAID courses (not yet implemented)
  if (accessType === 'PAID') {
    return (
      <div className="space-y-2">
        <button disabled className={`${baseClasses} ${primaryClasses} opacity-50 cursor-not-allowed`}>
          {price && currency
            ? `${price} ${currency}`
            : isKa
              ? 'გადახდა მალე'
              : 'Payment coming soon'}
        </button>
        <p className="text-sm text-text-secondary">
          {isKa ? 'გადახდის სისტემა მალე დაემატება' : 'Payment system coming soon'}
        </p>
      </div>
    )
  }

  // For FREE courses
  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={isLoading}
        className={`${baseClasses} ${primaryClasses} ${isLoading ? 'opacity-70' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {isKa ? 'რეგისტრაცია...' : 'Enrolling...'}
          </>
        ) : (
          <>
            {isKa ? 'უფასო რეგისტრაცია' : 'Enroll for Free'}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
