'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Badge, Modal } from '@/components/ui'
import {
  Loader2,
  Play,
  Pause,
  SkipForward,
  RefreshCw,
  Flame,
  Snowflake,
  Zap,
  ThermometerSun,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react'

interface WarmupState {
  config: {
    id: string
    serverId: string
    status: 'NOT_STARTED' | 'WARMING_UP' | 'PAUSED' | 'WARMED' | 'COOLING_DOWN' | 'COLD'
    currentDay: number
    sentToday: number
    lastSentAt: string | null
    startedAt: string | null
    pausedAt: string | null
    pauseReason: string | null
  }
  schedule: {
    day: number
    dailyLimit: number
    phase: string
    description: string
    allowedTiers: string[]
  } | null
  remainingToday: number
  allowedTiers: string[]
  phase: string | null
  progress: {
    currentDay: number
    totalDays: number
    percentComplete: number
  }
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    openRate: number
    bounceRate: number
    spamRate: number
    clickRate: number
  } | null
  health: 'healthy' | 'warning' | 'critical' | 'unknown'
  tierCounts: Record<string, number>
  totalContacts: number
}

interface WarmupLog {
  day: number
  phase: string
  dailyLimit: number
  actualSent: number
  openRate: number | null
  bounceRate: number | null
  spamRate: number | null
  createdAt: string
}

const healthVariants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  healthy: 'success',
  warning: 'warning',
  critical: 'error',
  unknown: 'default',
}

const phaseColors: Record<string, string> = {
  foundation: 'text-blue-600',
  growth: 'text-green-600',
  scaling: 'text-orange-600',
  maturation: 'text-purple-600',
  full: 'text-emerald-600',
}

const tierIcons: Record<string, React.ReactNode> = {
  HOT: <Flame className="w-4 h-4 text-red-500" />,
  NEW: <UserPlus className="w-4 h-4 text-blue-500" />,
  WARM: <ThermometerSun className="w-4 h-4 text-orange-500" />,
  COOL: <Snowflake className="w-4 h-4 text-cyan-500" />,
  COLD: <Snowflake className="w-4 h-4 text-blue-300" />,
}

export default function WarmupDashboard() {
  const [state, setState] = useState<WarmupState | null>(null)
  const [logs, setLogs] = useState<WarmupLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [targetDay, setTargetDay] = useState('')

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/warmup')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setState(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch warmup status')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/warmup/logs')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLogs(data.logs || [])
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }, [])

  useEffect(() => {
    fetchState()
    fetchLogs()
  }, [fetchState, fetchLogs])

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'advance', body?: object) => {
    setActionLoading(true)
    setError(null)
    try {
      let url = '/api/admin/warmup'
      let method = 'POST'

      if (action === 'pause') {
        url = '/api/admin/warmup/pause'
      } else if (action === 'resume') {
        url = '/api/admin/warmup/resume'
      } else if (action === 'advance') {
        url = '/api/admin/warmup/advance'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'start' ? { action: 'start' } : body || {}),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      await fetchState()
      await fetchLogs()
      setShowAdvanceModal(false)
      setTargetDay('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!state) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Failed to load warmup status</p>
        <Button onClick={fetchState} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return `${(value * 100).toFixed(2)}%`
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="no-margin">Email Warmup</h1>
          <p className="text-text-secondary mt-1">
            Marketing server warmup status and controls
          </p>
        </div>
        <Button
          onClick={() => {
            fetchState()
            fetchLogs()
          }}
          variant="outline"
          disabled={actionLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-neu mb-6">
          <p className="no-margin">{error}</p>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Current Status */}
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm text-text-secondary">Status</span>
            <Badge variant={healthVariants[state.health]}>{state.health.toUpperCase()}</Badge>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">
            {state.config.status === 'NOT_STARTED' && 'Not Started'}
            {state.config.status === 'WARMING_UP' && 'Warming Up'}
            {state.config.status === 'PAUSED' && 'Paused'}
            {state.config.status === 'WARMED' && 'Warmed'}
            {state.config.status === 'COOLING_DOWN' && 'Cooling Down'}
            {state.config.status === 'COLD' && 'Cold'}
          </p>
          {state.phase && (
            <p className={`text-body-sm mt-1 no-margin ${phaseColors[state.phase]}`}>
              {state.phase.charAt(0).toUpperCase() + state.phase.slice(1)} Phase
            </p>
          )}
        </div>

        {/* Current Day */}
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span className="text-body-sm text-text-secondary">Warmup Day</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">
            {state.progress.currentDay} / {state.progress.totalDays}
          </p>
          <div className="w-full bg-neu-dark rounded-full h-2 mt-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${state.progress.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Today's Capacity */}
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-body-sm text-text-secondary">Today's Capacity</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">
            {state.config.sentToday.toLocaleString()}
            {state.schedule && state.schedule.dailyLimit > 0 && (
              <span className="text-lg text-text-secondary">
                {' '}/ {state.schedule.dailyLimit.toLocaleString()}
              </span>
            )}
          </p>
          <p className="text-body-sm text-text-secondary no-margin mt-1">
            {state.remainingToday === Infinity
              ? 'Unlimited remaining'
              : `${state.remainingToday.toLocaleString()} remaining`}
          </p>
        </div>

        {/* Total Contacts */}
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-body-sm text-text-secondary">Total Contacts</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">
            {state.totalContacts.toLocaleString()}
          </p>
          <p className="text-body-sm text-text-secondary no-margin mt-1">
            Across all engagement tiers
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-neu-light rounded-neu shadow-neu p-4 mb-6">
        <h3 className="mb-4">Controls</h3>
        <div className="flex gap-3">
          {state.config.status === 'NOT_STARTED' && (
            <Button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Warmup
            </Button>
          )}
          {state.config.status === 'WARMING_UP' && (
            <>
              <Button
                onClick={() => handleAction('pause')}
                disabled={actionLoading}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button
                onClick={() => setShowAdvanceModal(true)}
                disabled={actionLoading}
                variant="outline"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Advance Day
              </Button>
            </>
          )}
          {state.config.status === 'PAUSED' && (
            <Button
              onClick={() => handleAction('resume')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Resume Warmup
            </Button>
          )}
        </div>
        {state.config.pauseReason && (
          <p className="text-body-sm text-yellow-600 mt-2 no-margin">
            Pause reason: {state.config.pauseReason}
          </p>
        )}
      </div>

      {/* Engagement Tiers and Metrics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Engagement Tiers */}
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <h3 className="mb-4">Engagement Tiers</h3>
          <div className="space-y-3">
            {(['HOT', 'NEW', 'WARM', 'COOL', 'COLD'] as const).map((tier) => {
              const count = state.tierCounts[tier] || 0
              const isAllowed = state.allowedTiers.includes(tier)
              const percentage =
                state.totalContacts > 0 ? (count / state.totalContacts) * 100 : 0

              return (
                <div key={tier} className={`${!isAllowed ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {tierIcons[tier]}
                      <span className="text-body-sm font-medium">{tier}</span>
                      {isAllowed ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <span className="text-body-sm text-text-secondary">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neu-dark rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        tier === 'HOT'
                          ? 'bg-red-500'
                          : tier === 'NEW'
                            ? 'bg-blue-500'
                            : tier === 'WARM'
                              ? 'bg-orange-500'
                              : tier === 'COOL'
                                ? 'bg-cyan-500'
                                : 'bg-blue-300'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {state.config.status === 'WARMING_UP' && (
            <p className="text-body-xs text-text-muted mt-4 no-margin">
              Day {state.progress.currentDay}: Only {state.allowedTiers.join(', ')} tiers allowed
            </p>
          )}
        </div>

        {/* Current Metrics */}
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <h3 className="mb-4">Recent Metrics (48h)</h3>
          {state.metrics ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-body-sm text-text-secondary no-margin">Sent</p>
                <p className="text-xl font-bold no-margin">{state.metrics.sent}</p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary no-margin">Delivered</p>
                <p className="text-xl font-bold no-margin">{state.metrics.delivered}</p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary no-margin">Open Rate</p>
                <p
                  className={`text-xl font-bold no-margin ${
                    state.metrics.openRate >= 0.15 ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {formatPercent(state.metrics.openRate)}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary no-margin">Click Rate</p>
                <p className="text-xl font-bold no-margin">
                  {formatPercent(state.metrics.clickRate)}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary no-margin">Bounce Rate</p>
                <p
                  className={`text-xl font-bold no-margin ${
                    state.metrics.bounceRate > 0.03 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatPercent(state.metrics.bounceRate)}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary no-margin">Spam Rate</p>
                <p
                  className={`text-xl font-bold no-margin ${
                    state.metrics.spamRate > 0.001 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatPercent(state.metrics.spamRate)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-text-muted">No metrics available yet</p>
          )}
          <div className="border-t border-neu-dark mt-4 pt-4">
            <p className="text-body-xs text-text-muted no-margin">
              <strong>Progression Requirements:</strong> Open rate ≥15%, Bounce ≤3%, Spam ≤0.1%
            </p>
          </div>
        </div>
      </div>

      {/* Warmup History */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <div className="p-4 border-b border-neu-dark">
          <h3 className="no-margin">Warmup History</h3>
        </div>
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">Day</th>
              <th className="px-6 py-3 text-left label-sm">Phase</th>
              <th className="px-6 py-3 text-left label-sm">Limit</th>
              <th className="px-6 py-3 text-left label-sm">Sent</th>
              <th className="px-6 py-3 text-left label-sm">Open Rate</th>
              <th className="px-6 py-3 text-left label-sm">Bounce Rate</th>
              <th className="px-6 py-3 text-left label-sm">Spam Rate</th>
              <th className="px-6 py-3 text-left label-sm">Date</th>
            </tr>
          </thead>
          <tbody className="bg-neu-light divide-y divide-neu-dark">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                  No warmup history yet
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-neu-base transition-colors">
                  <td className="px-6 py-4 font-medium">{log.day}</td>
                  <td className="px-6 py-4">
                    <span className={phaseColors[log.phase] || 'text-text-secondary'}>
                      {log.phase.charAt(0).toUpperCase() + log.phase.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.dailyLimit === -1 ? '∞' : log.dailyLimit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{log.actualSent.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        log.openRate && log.openRate >= 0.15 ? 'text-green-600' : 'text-yellow-600'
                      }
                    >
                      {formatPercent(log.openRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        log.bounceRate && log.bounceRate > 0.03 ? 'text-red-600' : 'text-green-600'
                      }
                    >
                      {formatPercent(log.bounceRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        log.spamRate && log.spamRate > 0.001 ? 'text-red-600' : 'text-green-600'
                      }
                    >
                      {formatPercent(log.spamRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{formatDate(log.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Advance Day Modal */}
      <Modal
        isOpen={showAdvanceModal}
        onClose={() => {
          setShowAdvanceModal(false)
          setTargetDay('')
        }}
        title="Advance Warmup Day"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            You can either advance to the next day or set a specific target day.
          </p>
          <div>
            <label className="block label-sm mb-2">Target Day (optional)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={targetDay}
              onChange={(e) => setTargetDay(e.target.value)}
              placeholder="Leave empty to advance to next day"
              className="w-full px-4 py-2 rounded-neu bg-neu-base shadow-neu-inset focus:shadow-neu-focus focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAdvanceModal(false)
                setTargetDay('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleAction('advance', targetDay ? { targetDay: parseInt(targetDay) } : {})
              }
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4 mr-2" />
              )}
              {targetDay ? `Set to Day ${targetDay}` : 'Advance to Next Day'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
