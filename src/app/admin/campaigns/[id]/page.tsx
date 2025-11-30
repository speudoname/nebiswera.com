'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  UserX,
  Loader2,
  Pause,
  X,
  Download,
  BarChart3,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
  unsubscribedCount: number
  scheduledAt: string | null
  sendingStartedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface Recipient {
  id: string
  email: string
  status: string
  sentAt: string | null
  deliveredAt: string | null
  openedAt: string | null
  clickedAt: string | null
  bouncedAt: string | null
  error: string | null
}

export default function CampaignStatsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  // Handle both Promise (production) and object (development)
  const resolvedParams = params instanceof Promise ? use(params) : params
  const id = resolvedParams.id
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCampaign()
    fetchRecipients()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCampaign(data)
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async () => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/stats`)
      if (res.ok) {
        const data = await res.json()
        setRecipients(data.recipients || [])
      }
    } catch (error) {
      console.error('Failed to fetch recipients:', error)
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/pause`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchCampaign()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to pause campaign')
      }
    } catch (error) {
      console.error('Failed to pause campaign:', error)
      alert('Failed to pause campaign')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/cancel`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchCampaign()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel campaign')
      }
    } catch (error) {
      console.error('Failed to cancel campaign:', error)
      alert('Failed to cancel campaign')
    } finally {
      setActionLoading(false)
    }
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%'
    return `${((numerator / denominator) * 100).toFixed(1)}%`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SCHEDULED: 'bg-blue-100 text-blue-700',
      SENDING: 'bg-yellow-100 text-yellow-700 animate-pulse',
      PAUSED: 'bg-orange-100 text-orange-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || badges.DRAFT}`}>
        {status}
      </span>
    )
  }

  const getRecipientStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-600',
      SENT: 'bg-blue-100 text-blue-700',
      DELIVERED: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      SKIPPED: 'bg-gray-100 text-gray-500',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.PENDING}`}>
        {status}
      </span>
    )
  }

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/campaigns"
            className="flex items-center text-text-muted hover:text-text-primary mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-text-primary">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-text-secondary mt-1">{campaign.subject}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'SENDING' && (
            <>
              <Button
                variant="secondary"
                onClick={handlePause}
                loading={actionLoading}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                loading={actionLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {(campaign.status === 'SCHEDULED' || campaign.status === 'PAUSED') && (
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={actionLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar (for SENDING status) */}
      {campaign.status === 'SENDING' && campaign.totalRecipients > 0 && (
        <div className="mb-8 bg-neu-light rounded-neu shadow-neu p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Sending Progress</span>
            <span className="text-sm text-text-muted">
              {campaign.sentCount} / {campaign.totalRecipients}
            </span>
          </div>
          <div className="w-full bg-neu-dark rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary-600 h-3 transition-all duration-300 rounded-full"
              style={{ width: `${(campaign.sentCount / campaign.totalRecipients) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={<Mail className="w-5 h-5" />}
          label="Sent"
          value={campaign.sentCount.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Delivered"
          value={campaign.deliveredCount.toLocaleString()}
          subtitle={calculateRate(campaign.deliveredCount, campaign.sentCount)}
          color="green"
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Opened"
          value={campaign.openedCount.toLocaleString()}
          subtitle={calculateRate(campaign.openedCount, campaign.deliveredCount)}
          color="purple"
        />
        <StatCard
          icon={<MousePointerClick className="w-5 h-5" />}
          label="Clicked"
          value={campaign.clickedCount.toLocaleString()}
          subtitle={calculateRate(campaign.clickedCount, campaign.deliveredCount)}
          color="indigo"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Bounced"
          value={campaign.bouncedCount.toLocaleString()}
          subtitle={calculateRate(campaign.bouncedCount, campaign.sentCount)}
          color="orange"
        />
        <StatCard
          icon={<UserX className="w-5 h-5" />}
          label="Unsubscribed"
          value={campaign.unsubscribedCount.toLocaleString()}
          subtitle={calculateRate(campaign.unsubscribedCount, campaign.deliveredCount)}
          color="red"
        />
      </div>

      {/* Recipients Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <div className="px-6 py-4 border-b border-neu-dark flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Recipients</h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neu-dark">
            <thead className="bg-neu-light">
              <tr>
                <th className="px-6 py-3 text-left label-sm">Email</th>
                <th className="px-6 py-3 text-left label-sm">Status</th>
                <th className="px-6 py-3 text-left label-sm">Sent</th>
                <th className="px-6 py-3 text-left label-sm">Delivered</th>
                <th className="px-6 py-3 text-left label-sm">Opened</th>
                <th className="px-6 py-3 text-left label-sm">Clicked</th>
                <th className="px-6 py-3 text-left label-sm">Error</th>
              </tr>
            </thead>
            <tbody className="bg-neu-light divide-y divide-neu-dark">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No recipients data available yet
                  </td>
                </tr>
              ) : (
                recipients.slice(0, 100).map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-neu-base/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{recipient.email}</td>
                    <td className="px-6 py-4">{getRecipientStatusBadge(recipient.status)}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(recipient.sentAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(recipient.deliveredAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(recipient.openedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(recipient.clickedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {recipient.error || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {recipients.length > 100 && (
          <div className="px-6 py-4 bg-neu-light border-t border-neu-dark text-center text-sm text-text-muted">
            Showing first 100 recipients. Export to CSV to see all.
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className={`${colors[color]} border-2 rounded-neu p-4`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs mt-1 opacity-75">{subtitle}</div>}
    </div>
  )
}
