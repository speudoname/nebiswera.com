'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
} from 'lucide-react'
import { formatPhoneForDisplay } from '@/lib/sms/utils'

interface SmsLog {
  id: string
  phone: string
  message: string
  brandId: number
  status: string
  type: string
  referenceType: string | null
  referenceId: string | null
  ubillSmsId: string | null
  error: string | null
  segments: number
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  today: {
    total: number
    sent: number
    delivered: number
    failed: number
    pending: number
  }
  period: {
    days: number
    total: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SENT: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  AWAITING: 'bg-gray-100 text-gray-700',
  ERROR: 'bg-red-100 text-red-700',
}

const TYPE_COLORS: Record<string, string> = {
  CAMPAIGN: 'bg-purple-100 text-purple-700',
  TRANSACTIONAL: 'bg-blue-100 text-blue-700',
}

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [searchPhone, setSearchPhone] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [daysFilter, setDaysFilter] = useState('30')
  const [page, setPage] = useState(1)

  // Expanded log for details
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '25',
          days: daysFilter,
        })

        if (searchPhone) params.set('phone', searchPhone)
        if (statusFilter) params.set('status', statusFilter)
        if (typeFilter) params.set('type', typeFilter)

        const res = await fetch(`/api/admin/sms/logs?${params}`)
        const data = await res.json()

        setLogs(data.logs || [])
        setPagination(data.pagination)
        setStats(data.stats)
      } catch (error) {
        console.error('Failed to fetch SMS logs:', error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, daysFilter, searchPhone, statusFilter, typeFilter]
  )

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

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
      <div className="mb-8">
        <Link
          href="/admin/sms"
          className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SMS
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-accent-900">SMS Logs</h1>
            <p className="text-accent-600 mt-1">View all sent SMS messages</p>
          </div>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-100 rounded-full"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-neu shadow-neu-flat p-4">
            <p className="text-sm text-accent-500">Today Total</p>
            <p className="text-xl font-bold text-accent-900">{stats.today.total}</p>
          </div>
          <div className="bg-white rounded-neu shadow-neu-flat p-4">
            <p className="text-sm text-accent-500">Sent</p>
            <p className="text-xl font-bold text-blue-600">{stats.today.sent}</p>
          </div>
          <div className="bg-white rounded-neu shadow-neu-flat p-4">
            <p className="text-sm text-accent-500">Delivered</p>
            <p className="text-xl font-bold text-green-600">{stats.today.delivered}</p>
          </div>
          <div className="bg-white rounded-neu shadow-neu-flat p-4">
            <p className="text-sm text-accent-500">Failed</p>
            <p className="text-xl font-bold text-red-600">{stats.today.failed}</p>
          </div>
          <div className="bg-white rounded-neu shadow-neu-flat p-4">
            <p className="text-sm text-accent-500">Pending</p>
            <p className="text-xl font-bold text-amber-600">{stats.today.pending}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-neu shadow-neu-flat p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-400" />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full pl-10 pr-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="AWAITING">Awaiting</option>
            <option value="ERROR">Error</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">All Types</option>
            <option value="TRANSACTIONAL">Transactional</option>
            <option value="CAMPAIGN">Campaign</option>
          </select>
          <select
            value={daysFilter}
            onChange={(e) => {
              setDaysFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </form>

      {/* Logs Table */}
      <div className="bg-white rounded-neu shadow-neu-flat overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-accent-300" />
            <p className="text-accent-600">No SMS logs found</p>
            <p className="text-sm text-accent-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-accent-50 border-b border-accent-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-accent-600">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-accent-600">Message</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-accent-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-accent-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-accent-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className={`border-b border-accent-100 hover:bg-accent-50/50 cursor-pointer ${
                          expandedId === log.id ? 'bg-accent-50' : ''
                        }`}
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <td className="py-3 px-4 text-sm font-mono">
                          {formatPhoneForDisplay(log.phone)}
                        </td>
                        <td className="py-3 px-4 text-sm text-accent-600 max-w-xs">
                          <div className="truncate">
                            {log.message.substring(0, 60)}
                            {log.message.length > 60 ? '...' : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${TYPE_COLORS[log.type]}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[log.status]}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-accent-500 whitespace-nowrap">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr key={`${log.id}-details`} className="bg-accent-50">
                          <td colSpan={5} className="py-4 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-accent-500">UBill SMS ID</p>
                                <p className="font-mono">{log.ubillSmsId || '—'}</p>
                              </div>
                              <div>
                                <p className="text-accent-500">Brand ID</p>
                                <p>{log.brandId}</p>
                              </div>
                              <div>
                                <p className="text-accent-500">Segments</p>
                                <p>{log.segments}</p>
                              </div>
                              <div>
                                <p className="text-accent-500">Reference</p>
                                <p>
                                  {log.referenceType
                                    ? `${log.referenceType}: ${log.referenceId || '—'}`
                                    : '—'}
                                </p>
                              </div>
                            </div>
                            {log.error && (
                              <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-700">
                                <strong>Error:</strong> {log.error}
                              </div>
                            )}
                            <div className="mt-4 p-3 bg-white rounded border border-accent-200">
                              <p className="text-accent-500 text-xs mb-1">Full Message:</p>
                              <p className="text-sm whitespace-pre-wrap">{log.message}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-accent-200 flex items-center justify-between">
                <p className="text-sm text-accent-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-accent-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
