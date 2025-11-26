'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button, Modal, Pagination } from '@/components/ui'
import {
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Copy,
  ExternalLink,
  Clock,
} from 'lucide-react'

type WebinarStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface Webinar {
  id: string
  title: string
  slug: string
  status: WebinarStatus
  presenterName: string | null
  videoDuration: number | null
  timezone: string
  createdAt: string
  publishedAt: string | null
  _count: {
    registrations: number
    sessions: number
  }
  scheduleConfig: {
    eventType: string
    onDemandEnabled: boolean
    justInTimeEnabled: boolean
    replayEnabled: boolean
  } | null
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function WebinarsTable() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<WebinarStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchWebinars = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/webinars?${params}`)
      if (res.ok) {
        const data = await res.json()
        setWebinars(data.webinars)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch webinars:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, search])

  useEffect(() => {
    fetchWebinars()
  }, [fetchWebinars])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchWebinars()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/webinars/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchWebinars()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete webinar')
      }
    } catch (error) {
      console.error('Failed to delete webinar:', error)
      alert('Failed to delete webinar')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/webinars/${id}/duplicate`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchWebinars()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to duplicate webinar')
      }
    } catch (error) {
      console.error('Failed to duplicate webinar:', error)
      alert('Failed to duplicate webinar')
    }
  }

  const getStatusBadge = (status: WebinarStatus) => {
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      ARCHIVED: 'bg-yellow-100 text-yellow-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {status}
      </span>
    )
  }

  const getScheduleTypeBadge = (webinar: Webinar) => {
    if (!webinar.scheduleConfig) return null

    const types: string[] = []
    if (webinar.scheduleConfig.eventType === 'RECURRING') types.push('Recurring')
    if (webinar.scheduleConfig.eventType === 'ONE_TIME') types.push('One-time')
    if (webinar.scheduleConfig.eventType === 'SPECIFIC_DATES') types.push('Specific dates')
    if (webinar.scheduleConfig.eventType === 'ON_DEMAND_ONLY') types.push('On-demand only')
    if (webinar.scheduleConfig.justInTimeEnabled) types.push('Just-in-time')
    if (webinar.scheduleConfig.onDemandEnabled && webinar.scheduleConfig.eventType !== 'ON_DEMAND_ONLY') types.push('On-demand')
    if (webinar.scheduleConfig.replayEnabled) types.push('Replay')

    return (
      <div className="flex flex-wrap gap-1">
        {types.map((type) => (
          <span
            key={type}
            className="px-1.5 py-0.5 rounded text-xs bg-primary-100 text-primary-700"
          >
            {type}
          </span>
        ))}
      </div>
    )
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 flex-1">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search webinars..."
              className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as WebinarStatus | 'all')
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <Link href="/admin/webinars/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Webinar
          </Button>
        </Link>
      </div>

      {/* Webinars Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">Webinar</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-left label-sm">Schedule</th>
              <th className="px-6 py-3 text-right label-sm">Duration</th>
              <th className="px-6 py-3 text-right label-sm">Registrations</th>
              <th className="px-6 py-3 text-left label-sm">Created</th>
              <th className="px-6 py-3 text-right label-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-neu-light divide-y divide-neu-dark">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : webinars.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                  {search || statusFilter !== 'all'
                    ? 'No webinars found matching your filters'
                    : 'No webinars yet. Create your first webinar!'}
                </td>
              </tr>
            ) : (
              webinars.map((webinar) => (
                <tr key={webinar.id} className="hover:bg-neu-base/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-text-primary">{webinar.title}</div>
                      <div className="text-sm text-text-muted">
                        {webinar.presenterName && (
                          <span>by {webinar.presenterName} · </span>
                        )}
                        <span className="font-mono text-xs">{webinar.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(webinar.status)}</td>
                  <td className="px-6 py-4">
                    {getScheduleTypeBadge(webinar) || (
                      <span className="text-text-muted text-sm">Not configured</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      {formatDuration(webinar.videoDuration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="w-3 h-3 text-text-muted" />
                      {webinar._count.registrations.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {formatDate(webinar.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Analytics */}
                      <Link
                        href={`/admin/webinars/${webinar.id}/analytics`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      {/* Registrations */}
                      <Link
                        href={`/admin/webinars/${webinar.id}/registrations`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Registrations"
                      >
                        <Users className="w-4 h-4" />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/admin/webinars/${webinar.id}`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(webinar.id)}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Preview landing page (only if published) */}
                      {webinar.status === 'PUBLISHED' && (
                        <a
                          href={`/ka/webinar/${webinar.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                          title="Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      {/* Delete (only for DRAFT or ARCHIVED) */}
                      {(webinar.status === 'DRAFT' || webinar.status === 'ARCHIVED') && (
                        <button
                          onClick={() => setDeleteConfirm(webinar.id)}
                          className="p-1 text-text-muted hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-neu-light px-4 py-3 flex items-center justify-between border-t border-neu-dark">
            <div className="flex items-center gap-4">
              <p className="text-body-sm text-secondary no-margin">
                Showing{' '}
                <span className="font-medium">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-muted">Per page:</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value)
                    setPagination((prev) => ({
                      ...prev,
                      limit: newLimit,
                      page: 1,
                    }))
                  }}
                  className="rounded-neu border-2 border-transparent bg-neu-base px-2 py-1 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Webinar"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          Are you sure you want to delete this webinar? This will also delete all registrations,
          analytics, and interactions. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            loading={deletingId === deleteConfirm}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
