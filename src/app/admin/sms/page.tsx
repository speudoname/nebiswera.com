'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Settings,
  MessageSquare,
  FileText,
  Send,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { formatPhoneForDisplay } from '@/lib/sms/utils'

interface SmsLog {
  id: string
  phone: string
  message: string
  status: string
  type: string
  createdAt: string
  ubillSmsId: string | null
  error: string | null
}

interface SmsStats {
  balance: number | null
  isConfigured: boolean
  todaySent: number
  todayDelivered: number
  todayFailed: number
  todayPending: number
  recentLogs: SmsLog[]
}

export default function SmsDashboardPage() {
  const [stats, setStats] = useState<SmsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)

    try {
      // Fetch settings to check if configured
      const settingsRes = await fetch('/api/admin/sms/settings')
      const settingsData = await settingsRes.json()

      let balance = null
      let todayStats = { sent: 0, delivered: 0, failed: 0, pending: 0 }
      let recentLogs: SmsLog[] = []

      if (settingsData.isConfigured) {
        // Fetch balance
        try {
          const balanceRes = await fetch('/api/admin/sms/balance')
          const balanceData = await balanceRes.json()
          balance = balanceData.balance
        } catch (e) {
          console.error('Failed to fetch balance', e)
        }

        // Fetch logs and stats
        try {
          const logsRes = await fetch('/api/admin/sms/logs?limit=10&days=1')
          const logsData = await logsRes.json()
          recentLogs = logsData.logs || []
          todayStats = logsData.stats?.today || todayStats
        } catch (e) {
          console.error('Failed to fetch logs', e)
        }
      }

      setStats({
        balance,
        isConfigured: settingsData.isConfigured,
        todaySent: todayStats.sent,
        todayDelivered: todayStats.delivered,
        todayFailed: todayStats.failed,
        todayPending: todayStats.pending,
        recentLogs,
      })
    } catch (error) {
      console.error('Failed to fetch SMS stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-900">SMS Dashboard</h1>
          <p className="text-accent-600 mt-1">Manage SMS campaigns and notifications</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-100 rounded-full"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Configuration Alert */}
      {!stats?.isConfigured && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-neu flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">SMS not configured</p>
            <p className="text-amber-700 text-sm mt-1">
              Please configure your UBill API key to start sending SMS messages.
            </p>
            <Link
              href="/admin/sms/settings"
              className="inline-flex items-center gap-2 mt-2 text-sm text-amber-800 hover:text-amber-900 font-medium"
            >
              <Settings className="h-4 w-4" />
              Go to Settings
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-500">SMS Balance</p>
              <p className="text-2xl font-bold text-accent-900 mt-1">
                {stats?.balance?.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className="p-3 bg-accent-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-500">Sent Today</p>
              <p className="text-2xl font-bold text-accent-900 mt-1">
                {stats?.todaySent ?? 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-500">Delivered</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats?.todayDelivered ?? 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-500">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats?.todayFailed ?? 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/sms/campaigns"
          className="bg-white rounded-neu shadow-neu-flat p-6 hover:shadow-neu-hover transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-100 rounded-neu group-hover:bg-accent-200 transition-colors">
              <TrendingUp className="h-6 w-6 text-accent-600" />
            </div>
            <div>
              <h3 className="font-semibold text-accent-900">Campaigns</h3>
              <p className="text-sm text-accent-500 mt-1">
                Create and manage bulk SMS campaigns
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/sms/templates"
          className="bg-white rounded-neu shadow-neu-flat p-6 hover:shadow-neu-hover transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-100 rounded-neu group-hover:bg-accent-200 transition-colors">
              <FileText className="h-6 w-6 text-accent-600" />
            </div>
            <div>
              <h3 className="font-semibold text-accent-900">Templates</h3>
              <p className="text-sm text-accent-500 mt-1">
                Manage SMS templates for notifications
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/sms/settings"
          className="bg-white rounded-neu shadow-neu-flat p-6 hover:shadow-neu-hover transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-100 rounded-neu group-hover:bg-accent-200 transition-colors">
              <Settings className="h-6 w-6 text-accent-600" />
            </div>
            <div>
              <h3 className="font-semibold text-accent-900">Settings</h3>
              <p className="text-sm text-accent-500 mt-1">
                Configure API keys and brand IDs
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-neu shadow-neu-flat p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-accent-900">Recent SMS Activity</h2>
          {stats?.recentLogs && stats.recentLogs.length > 0 && (
            <Link
              href="/admin/sms/logs"
              className="text-sm text-accent-600 hover:text-accent-800"
            >
              View all
            </Link>
          )}
        </div>

        {stats?.recentLogs && stats.recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-accent-500">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-accent-500">Message</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-accent-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-accent-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-accent-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-accent-100 hover:bg-accent-50/50">
                    <td className="py-3 px-4 text-sm font-mono">
                      {formatPhoneForDisplay(log.phone)}
                    </td>
                    <td className="py-3 px-4 text-sm text-accent-600 max-w-xs truncate">
                      {log.message.substring(0, 50)}{log.message.length > 50 ? '...' : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          log.type === 'CAMPAIGN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                          log.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-700'
                            : log.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700'
                            : log.status === 'FAILED' || log.status === 'ERROR'
                            ? 'bg-red-100 text-red-700'
                            : log.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-accent-500 whitespace-nowrap">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-accent-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No SMS activity yet</p>
            <p className="text-sm mt-1">
              {stats?.isConfigured
                ? 'Send your first SMS to see activity here'
                : 'Configure your SMS settings to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
