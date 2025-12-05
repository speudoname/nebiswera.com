'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Bell,
  Plus,
  Sparkles,
} from 'lucide-react'
import { CourseNotificationsEditor } from './NotificationsEditor'

interface NotificationAction {
  type: 'TAG_CONTACT'
  tagId: string
  tagName?: string
}

interface CourseNotification {
  id: string
  templateKey: string | null
  trigger: string
  triggerMinutes: number
  triggerDescription: string
  conditions: Record<string, unknown> | null
  channel: string
  subject: string | null
  previewText: string | null
  bodyHtml: string | null
  bodyText: string | null
  bodyDesign: string | null
  fromName: string | null
  fromEmail: string | null
  replyTo: string | null
  actions: NotificationAction[] | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  stats?: {
    sent: number
    pending: number
    queued: number
    logged: number
  }
  createdAt: string
  updatedAt: string
}

interface Course {
  id: string
  title: string
  locale: string
}

export default function CourseNotificationsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [notifications, setNotifications] = useState<CourseNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingDefaults, setCreatingDefaults] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      // Fetch course and notifications in parallel
      const [courseRes, notificationsRes] = await Promise.all([
        fetch(`/api/admin/courses/${id}`),
        fetch(`/api/admin/courses/${id}/notifications`),
      ])

      if (!courseRes.ok) {
        router.push('/admin/courses')
        return
      }

      const courseData = await courseRes.json()
      setCourse({
        id: courseData.id,
        title: courseData.title,
        locale: courseData.locale,
      })

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        setNotifications(notificationsData.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      router.push('/admin/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDefaults = async () => {
    setCreatingDefaults(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createDefaults' }),
      })

      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create default notifications')
      }
    } catch (error) {
      console.error('Failed to create defaults:', error)
      alert('Failed to create default notifications')
    } finally {
      setCreatingDefaults(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!course) {
    return null
  }

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
              <Bell className="w-8 h-8 text-primary-600" />
              Email Notifications
            </h1>
            <p className="text-text-muted mt-1">
              {course.title} &bull; Automated emails sent to students based on their progress
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="bg-neu-light rounded-neu shadow-neu p-8 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            No Notifications Configured
          </h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Set up automated email notifications to engage with your students at key moments:
            enrollment, progress milestones, inactivity reminders, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleCreateDefaults} disabled={creatingDefaults}>
              {creatingDefaults ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Default Notifications
                </>
              )}
            </Button>
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Notification
            </Button>
          </div>
        </div>
      ) : (
        <CourseNotificationsEditor
          courseId={id}
          courseTitle={course.title}
          courseLocale={course.locale as 'ka' | 'en'}
          initialNotifications={notifications}
          onNotificationsChange={setNotifications}
        />
      )}
    </div>
  )
}
