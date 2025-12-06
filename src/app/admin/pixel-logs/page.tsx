'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Badge } from '@/components/ui'
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Monitor,
  Server,
  Filter,
  X,
} from 'lucide-react'
import Link from 'next/link'

interface EventLog {
  id: string
  eventId: string
  eventName: string
  source: string
  pageType: string
  pageUrl: string
  status: string
  createdAt: string
  errorMsg?: string | null
}

interface ExpandedLogData {
  eventId: string
  pageUrl: string
  errorMsg?: string | null
  eventData?: Record<string, unknown> | null
  userData?: Record<string, unknown> | null
  fbResponse?: Record<string, unknown> | null
}

interface LogsResponse {
  logs: EventLog[]
  total: number
  page: number
  totalPages: number
}

const EVENT_NAMES = [
  'PageView',
  'ViewContent',
  'Lead',
  'CompleteRegistration',
  'WebinarStarted',
  'WebinarEngaged',
  'WebinarCompleted',
  'WebinarCTAClick',
  'CourseStarted',
  'LessonCompleted',
  'CourseCompleted',
]

const PAGE_TYPES = ['home', 'about', 'blog', 'blog-list', 'webinar-landing', 'webinar-watch', 'lms-course', 'lms-lesson', 'landing', 'other']

export default function PixelLogsPage() {
  const [logs, setLogs] = useState<EventLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [expandedLogData, setExpandedLogData] = useState<ExpandedLogData | null>(null)
  const [loadingLogData, setLoadingLogData] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    eventName: '',
    source: '',
    status: '',
    pageType: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')

      if (filters.eventName) params.set('eventName', filters.eventName)
      if (filters.source) params.set('source', filters.source)
      if (filters.status) params.set('status', filters.status)
      if (filters.pageType) params.set('pageType', filters.pageType)

      const res = await fetch(`/api/admin/pixel/logs?${params}`)
      if (res.ok) {
        const data: LogsResponse = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const handleDelete = async (daysToKeep: number) => {
    if (!confirm(`Delete all logs older than ${daysToKeep} days?`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/pixel/logs?daysToKeep=${daysToKeep}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Deleted ${data.deletedCount} logs`)
        fetchLogs()
      }
    } catch (error) {
      console.error('Failed to delete logs:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleExpandLog = async (logId: string) => {
    if (expandedLog === logId) {
      setExpandedLog(null)
      setExpandedLogData(null)
      return
    }

    setExpandedLog(logId)
    setLoadingLogData(true)

    try {
      const res = await fetch(`/api/admin/pixel/logs?id=${logId}`)
      if (res.ok) {
        const data = await res.json() as ExpandedLogData
        setExpandedLogData(data)
      }
    } catch (error) {
      console.error('Failed to fetch log details:', error)
    } finally {
      setLoadingLogData(false)
    }
  }

  const clearFilters = () => {
    setFilters({ eventName: '', source: '', status: '', pageType: '' })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Sent</Badge>
      case 'failed':
        return <Badge variant="error"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>
      case 'test':
        return <Badge variant="warning"><FlaskConical className="h-3 w-3 mr-1" /> Test</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const getSourceIcon = (source: string) => {
    return source === 'client' ? (
      <span title="Client-side"><Monitor className="h-4 w-4 text-primary-500" /></span>
    ) : (
      <span title="Server-side"><Server className="h-4 w-4 text-secondary-500" /></span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-12 w-12 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="no-margin">Pixel Event Logs</h1>
          <p className="text-body-sm text-muted mt-1">
            Track Facebook Pixel events and debug issues
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="text-body-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Settings
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-neu-light rounded-neu shadow-neu p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-2 border-neu-dark"
              />
              <span className="text-body-sm text-secondary">Auto-refresh</span>
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-primary-500' : ''}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-body-sm text-muted">
              {total} events
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(7)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clean up (7d+)
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-neu-dark">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-caption text-muted mb-1">Event</label>
                <select
                  value={filters.eventName}
                  onChange={(e) => setFilters({ ...filters, eventName: e.target.value })}
                  className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-1.5 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">All Events</option>
                  {EVENT_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-caption text-muted mb-1">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-1.5 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">All Sources</option>
                  <option value="client">Client</option>
                  <option value="server">Server</option>
                </select>
              </div>

              <div>
                <label className="block text-caption text-muted mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-1.5 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="test">Test</option>
                </select>
              </div>

              <div>
                <label className="block text-caption text-muted mb-1">Page Type</label>
                <select
                  value={filters.pageType}
                  onChange={(e) => setFilters({ ...filters, pageType: e.target.value })}
                  className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-1.5 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">All Pages</option>
                  {PAGE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-neu-light rounded-neu shadow-neu">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neu-dark">
                <th className="px-4 py-3 text-left text-body-sm font-medium text-secondary">Event</th>
                <th className="px-4 py-3 text-left text-body-sm font-medium text-secondary">Page</th>
                <th className="px-4 py-3 text-center text-body-sm font-medium text-secondary">Source</th>
                <th className="px-4 py-3 text-left text-body-sm font-medium text-secondary">Status</th>
                <th className="px-4 py-3 text-left text-body-sm font-medium text-secondary">Time</th>
                <th className="px-4 py-3 text-right text-body-sm font-medium text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neu-dark">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No events found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-neu-base transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary">{log.eventName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{log.pageType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getSourceIcon(log.source)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-muted">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExpandLog(log.id)}
                        >
                          {expandedLog === log.id ? 'Hide' : 'Details'}
                        </Button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={6} className="px-4 py-4 bg-neu-base">
                          {loadingLogData ? (
                            <div className="flex items-center justify-center py-4">
                              <RefreshCw className="h-5 w-5 animate-spin text-primary-500" />
                            </div>
                          ) : expandedLogData ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-caption text-muted">Event ID:</span>
                                  <code className="block text-body-sm break-all">
                                    {expandedLogData.eventId as string}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-caption text-muted">Page URL:</span>
                                  <a
                                    href={expandedLogData.pageUrl as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-body-sm text-primary-600 hover:text-primary-700 truncate"
                                  >
                                    {expandedLogData.pageUrl as string}
                                    <ExternalLink className="h-3 w-3 inline ml-1" />
                                  </a>
                                </div>
                              </div>

                              {typeof expandedLogData.errorMsg === 'string' && expandedLogData.errorMsg && (
                                <div className="p-3 bg-primary-50 border border-primary-200 rounded-neu">
                                  <span className="text-caption text-primary-700">Error:</span>
                                  <p className="text-body-sm text-primary-800 mt-1">
                                    {expandedLogData.errorMsg}
                                  </p>
                                </div>
                              )}

                              {'eventData' in expandedLogData && expandedLogData.eventData && (
                                <div>
                                  <span className="text-caption text-muted">Event Data:</span>
                                  <pre className="mt-1 p-2 bg-neu-dark rounded text-xs overflow-x-auto">
                                    {JSON.stringify(expandedLogData.eventData, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {'userData' in expandedLogData && expandedLogData.userData && (
                                <div>
                                  <span className="text-caption text-muted">User Data Fields:</span>
                                  <pre className="mt-1 p-2 bg-neu-dark rounded text-xs overflow-x-auto">
                                    {JSON.stringify(expandedLogData.userData, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {'fbResponse' in expandedLogData && expandedLogData.fbResponse && (
                                <div>
                                  <span className="text-caption text-muted">Facebook Response:</span>
                                  <pre className="mt-1 p-2 bg-neu-dark rounded text-xs overflow-x-auto">
                                    {JSON.stringify(expandedLogData.fbResponse, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted">No additional data</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neu-dark flex items-center justify-between">
            <span className="text-body-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
