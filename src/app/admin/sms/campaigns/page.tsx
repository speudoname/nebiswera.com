'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  FileEdit,
  Trash2,
  Users,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  message: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  targetType: string
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  scheduledAt: string | null
  createdAt: string
  _count: {
    recipients: number
  }
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileEdit },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock },
  SENDING: { label: 'Sending', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
  PAUSED: { label: 'Paused', color: 'bg-orange-100 text-orange-700', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function SmsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/sms/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleSend = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return

    setSendingId(id)
    try {
      const response = await fetch(`/api/admin/sms/campaigns/${id}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send campaign')
      }

      const data = await response.json()
      alert(`Campaign queued successfully!\nRecipients: ${data.totalRecipients}\nQueued: ${data.queued}\nSkipped: ${data.skipped}`)
      fetchCampaigns()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send campaign')
    } finally {
      setSendingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/sms/campaigns/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete campaign')
      }

      fetchCampaigns()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
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
            <h1 className="text-2xl font-bold text-accent-900">SMS Campaigns</h1>
            <p className="text-accent-600 mt-1">Create and manage bulk SMS campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-neu mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && campaigns.length === 0 && (
        <div className="bg-white rounded-neu shadow-neu-flat p-12 text-center">
          <Send className="h-16 w-16 mx-auto mb-4 text-accent-300" />
          <h2 className="text-xl font-semibold text-accent-900 mb-2">No Campaigns Yet</h2>
          <p className="text-accent-600 max-w-md mx-auto mb-6">
            Create your first SMS campaign to send bulk messages to your contacts.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700"
          >
            Create Campaign
          </button>
        </div>
      )}

      {/* Campaigns List */}
      {!loading && campaigns.length > 0 && (
        <div className="bg-white rounded-neu shadow-neu-flat overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-accent-50 border-b border-accent-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-accent-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent-200">
              {campaigns.map((campaign) => {
                const status = statusConfig[campaign.status]
                const StatusIcon = status.icon

                return (
                  <tr key={campaign.id} className="hover:bg-accent-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-accent-900">{campaign.name}</div>
                        <div className="text-sm text-accent-500 truncate max-w-xs">
                          {campaign.message.substring(0, 50)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-accent-600">
                        <Users className="h-4 w-4" />
                        {campaign.totalRecipients || campaign._count.recipients || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-green-600">{campaign.deliveredCount} delivered</span>
                        {campaign.failedCount > 0 && (
                          <span className="text-red-600 ml-2">{campaign.failedCount} failed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-accent-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleSend(campaign.id)}
                              disabled={sendingId === campaign.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Send Campaign"
                            >
                              {sendingId === campaign.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              disabled={deletingId === campaign.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="Delete Campaign"
                            >
                              {deletingId === campaign.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchCampaigns()
          }}
        />
      )}
    </div>
  )
}

function CreateCampaignModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState('ALL')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const response = await fetch('/api/admin/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, targetType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create campaign')
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-neu shadow-neu-raised p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-bold text-accent-900 mb-4">Create SMS Campaign</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-accent-700 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-accent-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., New Year Promo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-accent-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Enter your SMS message..."
            />
            <p className="text-xs text-accent-500 mt-1">
              Use {'{{firstName}}'} for personalization. {message.length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-accent-700 mb-1">
              Target Audience
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full px-3 py-2 border border-accent-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="ALL">All Contacts</option>
              <option value="TAGS">By Tags</option>
              <option value="WEBINAR_REGISTRANTS">Webinar Registrants</option>
              <option value="COURSE_ENROLLEES">Course Enrollees</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-accent-700 hover:bg-accent-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name || !message}
              className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
