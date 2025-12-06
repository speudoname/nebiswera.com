'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flame, AlertTriangle, CheckCircle, Pause, TrendingUp, ExternalLink } from 'lucide-react'

interface WarmupState {
  config: {
    status: 'NOT_STARTED' | 'WARMING_UP' | 'PAUSED' | 'WARMED' | 'COOLING_DOWN' | 'COLD'
    currentDay: number
    sentToday: number
  }
  schedule: {
    dailyLimit: number
    phase: string
  } | null
  remainingToday: number
  progress: {
    currentDay: number
    totalDays: number
    percentComplete: number
  }
  health: 'healthy' | 'warning' | 'critical' | 'unknown'
}

export function WarmupBanner() {
  const [state, setState] = useState<WarmupState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWarmup() {
      try {
        const res = await fetch('/api/admin/warmup')
        const data = await res.json()
        if (data.success !== false) {
          setState(data.data)
        }
      } catch {
        // Silently fail - banner is optional
      } finally {
        setLoading(false)
      }
    }
    fetchWarmup()
  }, [])

  if (loading || !state) return null

  // Don't show banner if warmup is warmed (completed)
  if (state.config.status === 'WARMED') return null

  const getStatusColor = () => {
    if (state.config.status === 'NOT_STARTED') return 'bg-gray-50 border-gray-200'
    if (state.config.status === 'PAUSED') return 'bg-yellow-50 border-yellow-200'
    if (state.health === 'critical') return 'bg-red-50 border-red-200'
    if (state.health === 'warning') return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  const getIcon = () => {
    if (state.config.status === 'NOT_STARTED') return <Flame className="w-5 h-5 text-gray-500" />
    if (state.config.status === 'PAUSED') return <Pause className="w-5 h-5 text-yellow-600" />
    if (state.health === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600" />
    if (state.health === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <CheckCircle className="w-5 h-5 text-green-600" />
  }

  const getMessage = () => {
    if (state.config.status === 'NOT_STARTED') {
      return 'Email warmup has not been started. Start warmup to build sender reputation.'
    }
    if (state.config.status === 'PAUSED') {
      return 'Warmup is paused. Resume to continue building sender reputation.'
    }
    if (state.health === 'critical') {
      return 'Warmup health is critical! High bounce or spam rates detected.'
    }
    if (state.health === 'warning') {
      return 'Warmup metrics need attention. Check open rates and bounce rates.'
    }

    const limit = state.schedule?.dailyLimit || 0
    const remaining = state.remainingToday
    const phase = state.schedule?.phase || ''

    return (
      <>
        <strong>Day {state.progress.currentDay}/30</strong> ({phase} phase) —{' '}
        {remaining === Infinity ? (
          'Unlimited capacity'
        ) : (
          <>
            <strong>{remaining.toLocaleString()}</strong> emails remaining today
            (sent {state.config.sentToday.toLocaleString()} / {limit.toLocaleString()})
          </>
        )}
      </>
    )
  }

  return (
    <div className={`rounded-neu border p-4 mb-6 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="text-body-sm no-margin">{getMessage()}</p>
            {state.config.status === 'WARMING_UP' && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full"
                    style={{ width: `${state.progress.percentComplete}%` }}
                  />
                </div>
                <span className="text-body-xs text-text-muted">
                  {state.progress.percentComplete}% complete
                </span>
              </div>
            )}
          </div>
        </div>
        <Link
          href="/admin/warmup"
          className="flex items-center gap-1 text-primary-600 text-body-sm hover:underline"
        >
          <TrendingUp className="w-4 h-4" />
          Warmup Dashboard
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
