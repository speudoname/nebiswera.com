'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Download,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui'

interface Registration {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  sessionType: string
  registeredAt: string
  joinedAt: string | null
  watchTimeSeconds: number
  completedAt: string | null
  engagementScore: number | null
  source: string | null
}

interface RegistrationsTableProps {
  webinarId: string
}

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-800',
  ATTENDING: 'bg-yellow-100 text-yellow-800',
  ATTENDED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  MISSED: 'bg-gray-100 text-gray-800',
}

export function RegistrationsTable({ webinarId }: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchRegistrations()
  }, [webinarId, page, searchQuery, statusFilter])

  const fetchRegistrations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/webinars/${webinarId}/registrations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRegistrations(data.registrations)
        setTotalPages(data.totalPages)
        setTotalCount(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatWatchTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const exportCSV = async () => {
    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}/registrations/export`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `webinar-${webinarId}-registrations.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-neu-dark rounded-neu bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-neu-dark rounded-neu bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="REGISTERED">Registered</option>
            <option value="ATTENDING">Attending</option>
            <option value="ATTENDED">Attended</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
        </div>

        {/* Export Button */}
        <Button variant="secondary" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neu-light rounded-neu p-4 shadow-neu-sm">
          <div className="text-2xl font-bold text-text-primary">{totalCount}</div>
          <div className="text-sm text-text-muted">Total Registrations</div>
        </div>
        <div className="bg-neu-light rounded-neu p-4 shadow-neu-sm">
          <div className="text-2xl font-bold text-green-600">
            {registrations.filter(r => r.status === 'ATTENDED' || r.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-text-muted">Attended</div>
        </div>
        <div className="bg-neu-light rounded-neu p-4 shadow-neu-sm">
          <div className="text-2xl font-bold text-purple-600">
            {registrations.filter(r => r.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-text-muted">Completed</div>
        </div>
        <div className="bg-neu-light rounded-neu p-4 shadow-neu-sm">
          <div className="text-2xl font-bold text-gray-600">
            {registrations.filter(r => r.status === 'MISSED').length}
          </div>
          <div className="text-sm text-text-muted">Missed</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neu-base border-b border-neu-dark">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  Registered
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  Watch Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  Engagement
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neu-dark">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    Loading...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    No registrations found
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-neu-base/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                          {(reg.firstName?.[0] || reg.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            {reg.firstName || reg.lastName
                              ? `${reg.firstName || ''} ${reg.lastName || ''}`.trim()
                              : 'No name'}
                          </div>
                          <div className="text-sm text-text-muted flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {reg.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[reg.status] || 'bg-gray-100 text-gray-800'}`}>
                        {reg.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                        {reg.status === 'MISSED' && <XCircle className="w-3 h-3" />}
                        {reg.status === 'ATTENDED' && <Eye className="w-3 h-3" />}
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDate(reg.registeredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-text-secondary">
                        <Clock className="w-4 h-4" />
                        {formatWatchTime(reg.watchTimeSeconds)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {reg.engagementScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-neu-dark rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${Math.min(100, reg.engagementScore)}%` }}
                            />
                          </div>
                          <span className="text-sm text-text-muted">
                            {Math.round(reg.engagementScore)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {reg.source || 'Direct'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neu-dark">
            <div className="text-sm text-text-muted">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-text-primary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
