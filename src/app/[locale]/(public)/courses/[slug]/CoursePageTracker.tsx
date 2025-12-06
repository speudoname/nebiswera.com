'use client'

import { useEffect } from 'react'
import { usePixel } from '@/hooks/usePixel'
import { useViewContentTracker } from '@/hooks/useViewContentTracker'

interface CoursePageTrackerProps {
  courseId: string
  courseTitle: string
  courseCategory?: string
}

export function CoursePageTracker({ courseId, courseTitle, courseCategory }: CoursePageTrackerProps) {
  const { trackPageView } = usePixel({ pageType: 'lms-course' })

  // ViewContent tracking - 50% scroll OR 20s on page
  useViewContentTracker({
    pageType: 'lms-course',
    contentParams: {
      content_name: courseTitle,
      content_category: courseCategory || 'Course',
      content_ids: [courseId],
      content_type: 'course',
      course_id: courseId,
      course_name: courseTitle,
    },
  })

  // Track PageView on mount
  useEffect(() => {
    trackPageView({
      content_name: courseTitle,
      content_category: courseCategory || 'Course',
      content_type: 'course',
      course_id: courseId,
    })
  }, [trackPageView, courseId, courseTitle, courseCategory])

  return null // This component doesn't render anything
}
