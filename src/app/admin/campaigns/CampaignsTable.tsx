'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button, Modal, Pagination } from '@/components/ui'
import {
  AlertTriangle,
  Loader2,
  Plus,
  Play,
  Pause,
  X,
  BarChart3,
  Copy,
  Trash2,
  Edit,
  Mail,
  Eye,
} from 'lucide-react'

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

interface Campaign {
  id: string
  name: string
  subject: string
  status: CampaignStatus
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  scheduledAt: string | null
  sendingStartedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function CampaignsTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/campaigns?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, search])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCampaigns()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchCampaigns()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      alert('Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePause = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/pause`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchCampaigns()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to pause campaign')
      }
    } catch (error) {
      console.error('Failed to pause campaign:', error)
      alert('Failed to pause campaign')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/cancel`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchCampaigns()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel campaign')
      }
    } catch (error) {
      console.error('Failed to cancel campaign:', error)
      alert('Failed to cancel campaign')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: CampaignStatus) => {
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SCHEDULED: 'bg-blue-100 text-blue-700',
      SENDING: 'bg-yellow-100 text-yellow-700 animate-pulse',
      PAUSED: 'bg-orange-100 text-orange-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '-'
    return `${((numerator / denominator) * 100).toFixed(1)}%`
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
              placeholder="Search campaigns..."
              className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CampaignStatus | 'all')
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENDING">Sending</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <Link href="/admin/campaigns/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Campaigns Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">Campaign</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-right label-sm">Recipients</th>
              <th className="px-6 py-3 text-right label-sm">Sent</th>
              <th className="px-6 py-3 text-right label-sm">Opened</th>
              <th className="px-6 py-3 text-right label-sm">Clicked</th>
              <th className="px-6 py-3 text-left label-sm">Date</th>
              <th className="px-6 py-3 text-right label-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-neu-light divide-y divide-neu-dark">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                  {search || statusFilter !== 'all'
                    ? 'No campaigns found matching your filters'
                    : 'No campaigns yet. Create your first campaign!'}
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-neu-base/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-text-primary">{campaign.name}</div>
                      <div className="text-sm text-text-muted truncate max-w-xs">
                        {campaign.subject}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(campaign.status)}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    {campaign.totalRecipients.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {campaign.sentCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div>{campaign.openedCount.toLocaleString()}</div>
                    <div className="text-xs text-text-muted">
                      {calculateRate(campaign.openedCount, campaign.deliveredCount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div>{campaign.clickedCount.toLocaleString()}</div>
                    <div className="text-xs text-text-muted">
                      {calculateRate(campaign.clickedCount, campaign.deliveredCount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {campaign.status === 'SCHEDULED' && campaign.scheduledAt
                      ? formatDate(campaign.scheduledAt)
                      : campaign.status === 'COMPLETED' && campaign.completedAt
                      ? formatDate(campaign.completedAt)
                      : campaign.sendingStartedAt
                      ? formatDate(campaign.sendingStartedAt)
                      : formatDate(campaign.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Stats */}
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="View stats"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      {/* Edit (only for DRAFT) */}
                      {campaign.status === 'DRAFT' && (
                        <Link
                          href={`/admin/campaigns/${campaign.id}/edit`}
                          className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {/* Pause (only for SENDING) */}
                      {campaign.status === 'SENDING' && (
                        <button
                          onClick={() => handlePause(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          className="p-1 text-text-muted hover:text-orange-600 transition-colors disabled:opacity-50"
                          title="Pause"
                        >
                          {actionLoading === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Pause className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Cancel (for SCHEDULED or PAUSED) */}
                      {(campaign.status === 'SCHEDULED' || campaign.status === 'PAUSED') && (
                        <button
                          onClick={() => handleCancel(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          className="p-1 text-text-muted hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          {actionLoading === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Delete (only for DRAFT or CANCELLED) */}
                      {(campaign.status === 'DRAFT' || campaign.status === 'CANCELLED') && (
                        <button
                          onClick={() => setDeleteConfirm(campaign.id)}
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
                  <option value={100}>100</option>
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
        title="Delete Campaign"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          Are you sure you want to delete this campaign? This action cannot be undone.
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
