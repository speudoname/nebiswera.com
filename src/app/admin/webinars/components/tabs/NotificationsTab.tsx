'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { NotificationsEditor, type Notification } from '../NotificationsEditor'

interface NotificationsTabProps {
  webinarId: string
  webinarTitle: string
  webinarLanguage: 'ka' | 'en'
}

export function NotificationsTab({
  webinarId,
  webinarTitle,
  webinarLanguage,
}: NotificationsTabProps) {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/notifications`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        } else {
          throw new Error('Failed to fetch notifications')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [webinarId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  return (
    <NotificationsEditor
      webinarId={webinarId}
      webinarTitle={webinarTitle}
      webinarLanguage={webinarLanguage}
      initialNotifications={notifications}
    />
  )
}
