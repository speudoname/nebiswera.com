'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { ScheduleConfigForm, type ScheduleConfig } from '../ScheduleConfigForm'

interface ScheduleTabProps {
  webinarId: string
  webinarTimezone: string
}

export function ScheduleTab({ webinarId, webinarTimezone }: ScheduleTabProps) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ScheduleConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/schedule`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data.config)
        } else {
          throw new Error('Failed to fetch schedule')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [webinarId])

  const handleSave = async (scheduleConfig: ScheduleConfig) => {
    const res = await fetch(`/api/admin/webinars/${webinarId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleConfig),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save schedule')
    }

    const data = await res.json()
    setConfig(data.config)
  }

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
    <ScheduleConfigForm
      webinarId={webinarId}
      webinarTimezone={webinarTimezone}
      initialConfig={config}
      onSave={handleSave}
    />
  )
}
