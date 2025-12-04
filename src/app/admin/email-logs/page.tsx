'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Modal, Pagination, Badge } from '@/components/ui'
import { FilterBar, EmailLogRow } from '../components'
import { Loader2, Mail, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

// ===== Types =====

interface EmailLog {
  id: string
  messageId: string
  to: string
  subject: string
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'WELCOME' | 'CAMPAIGN' | 'NEWSLETTER' | 'BROADCAST' | 'ANNOUNCEMENT' | 'WEBINAR'
  category: 'TRANSACTIONAL' | 'MARKETING'
  status: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'SPAM_COMPLAINT' | 'OPENED'
  locale: string
  sentAt: string
  deliveredAt: string | null
  openedAt: string | null
  bouncedAt: string | null
  bounceType: string | null
}

interface QueueItem {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'SKIPPED' | 'FAILED'
  scheduledAt: string
  processedAt: string | null
  attempts: number
  lastError: string | null
  createdAt: string
  notification: {
    id: string
    triggerType: string
    triggerMinutes: number
    templateKey: string | null
    subject: string | null
    webinar: {
      id: string
      title: string
      slug: string
    }
  } | null
  registration: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

interface QueueSummary {
  pending: number
  processing: number
  sent: number
  skipped: number
  failed: number
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ===== Variants =====

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  SENT: 'info',
  DELIVERED: 'success',
  BOUNCED: 'error',
  SPAM_COMPLAINT: 'error',
  OPENED: 'info',
}

const typeVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  VERIFICATION: 'info',
  PASSWORD_RESET: 'warning',
  WELCOME: 'success',
  CAMPAIGN: 'default',
  NEWSLETTER: 'default',
  BROADCAST: 'default',
  ANNOUNCEMENT: 'default',
  WEBINAR: 'info',
}

const categoryVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  TRANSACTIONAL: 'info',
  MARKETING: 'warning',
}

const queueStatusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  SENT: 'success',
  SKIPPED: 'default',
  FAILED: 'error',
}

// ===== Main Component =====

export default function EmailLogsPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'queue'>('logs')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="no-margin">Email Logs</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-neu text-sm font-medium transition-all ${
            activeTab === 'logs'
              ? 'bg-primary-500 text-white shadow-neu-pressed'
              : 'bg-neu-light text-text-secondary shadow-neu hover:shadow-neu-hover'
          }`}
        >
          <Mail className="w-4 h-4 inline-block mr-2" />
          Email Logs
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-neu text-sm font-medium transition-all ${
            activeTab === 'queue'
              ? 'bg-primary-500 text-white shadow-neu-pressed'
              : 'bg-neu-light text-text-secondary shadow-neu hover:shadow-neu-hover'
          }`}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Webinar Queue
        </button>
      </div>

      {activeTab === 'logs' ? <EmailLogsTab /> : <WebinarQueueTab />}
    </div>
  )
}

// ===== Email Logs Tab =====

function EmailLogsTab() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status,
        type,
        category,
      })
      const res = await fetch(`/api/admin/email-logs?${params}`)
      const data = await res.json()
      setEmails(data.emails)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch email logs:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, status, type, category])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchEmails()
  }

  return (
    <>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        searchPlaceholder="Search by email address..."
        filters={[
          {
            name: 'category',
            label: 'Category',
            value: category,
            onChange: (value) => {
              setCategory(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All Emails' },
              { value: 'TRANSACTIONAL', label: 'Transactional' },
              { value: 'MARKETING', label: 'Marketing' },
            ],
          },
          {
            name: 'status',
            label: 'Status',
            value: status,
            onChange: (value) => {
              setStatus(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'SENT', label: 'Sent' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'BOUNCED', label: 'Bounced' },
              { value: 'SPAM_COMPLAINT', label: 'Spam Complaint' },
              { value: 'OPENED', label: 'Opened' },
            ],
          },
          {
            name: 'type',
            label: 'Type',
            value: type,
            onChange: (value) => {
              setType(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All Types' },
              { value: 'VERIFICATION', label: 'Verification' },
              { value: 'PASSWORD_RESET', label: 'Password Reset' },
              { value: 'WELCOME', label: 'Welcome' },
              { value: 'CAMPAIGN', label: 'Campaign' },
              { value: 'NEWSLETTER', label: 'Newsletter' },
              { value: 'BROADCAST', label: 'Broadcast' },
              { value: 'ANNOUNCEMENT', label: 'Announcement' },
              { value: 'WEBINAR', label: 'Webinar' },
            ],
          },
        ]}
      />

      {/* Email Logs Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">Recipient</th>
              <th className="px-6 py-3 text-left label-sm">Category</th>
              <th className="px-6 py-3 text-left label-sm">Type</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-left label-sm">Sent</th>
              <th className="px-6 py-3 text-right label-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-neu-light divide-y divide-neu-dark">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                  No email logs found
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <EmailLogRow
                  key={email.id}
                  email={email}
                  onViewDetails={() => setSelectedEmail(email)}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-neu-light px-4 py-3 flex items-center justify-between border-t border-neu-dark">
            <div className="flex-1 flex items-center justify-between">
              <p className="text-body-sm text-secondary no-margin">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Email Details Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title="Email Details"
        size="lg"
      >
        {selectedEmail && (
          <EmailDetails email={selectedEmail} onClose={() => setSelectedEmail(null)} />
        )}
      </Modal>
    </>
  )
}

// ===== Webinar Queue Tab =====

function WebinarQueueTab() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [summary, setSummary] = useState<QueueSummary>({
    pending: 0,
    processing: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  })
  const [webinars, setWebinars] = useState<{ id: string; title: string }[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [webinarId, setWebinarId] = useState('all')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status,
        webinarId,
      })
      const res = await fetch(`/api/admin/webinar-queue?${params}`)
      const data = await res.json()
      setItems(data.items)
      setSummary(data.summary)
      setWebinars(data.webinars)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch queue:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, status, webinarId])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchQueue()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTrigger = (type: string, minutes: number) => {
    const absMinutes = Math.abs(minutes)
    let timing: string
    if (absMinutes === 0) {
      timing = 'Immediately'
    } else if (absMinutes < 60) {
      timing = `${absMinutes}m`
    } else if (absMinutes < 1440) {
      timing = `${Math.floor(absMinutes / 60)}h`
    } else {
      timing = `${Math.floor(absMinutes / 1440)}d`
    }

    switch (type) {
      case 'AFTER_REGISTRATION':
        return minutes === 0 ? 'After registration' : `${timing} after registration`
      case 'BEFORE_START':
        return `${timing} before start`
      case 'AFTER_END':
        return `${timing} after end`
      default:
        return type
    }
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-body-sm text-text-secondary">Pending</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">{summary.pending}</p>
        </div>
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-4 h-4 text-blue-500" />
            <span className="text-body-sm text-text-secondary">Processing</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">{summary.processing}</p>
        </div>
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-body-sm text-text-secondary">Sent</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">{summary.sent}</p>
        </div>
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            <span className="text-body-sm text-text-secondary">Skipped</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">{summary.skipped}</p>
        </div>
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-body-sm text-text-secondary">Failed</span>
          </div>
          <p className="text-2xl font-bold text-text-primary no-margin">{summary.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        searchPlaceholder="Search by email or name..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            value: status,
            onChange: (value) => {
              setStatus(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'PROCESSING', label: 'Processing' },
              { value: 'SENT', label: 'Sent' },
              { value: 'SKIPPED', label: 'Skipped' },
              { value: 'FAILED', label: 'Failed' },
            ],
          },
          {
            name: 'webinarId',
            label: 'Webinar',
            value: webinarId,
            onChange: (value) => {
              setWebinarId(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All Webinars' },
              ...webinars.map((w) => ({ value: w.id, label: w.title })),
            ],
          },
        ]}
      />

      {/* Queue Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">Recipient</th>
              <th className="px-6 py-3 text-left label-sm">Webinar</th>
              <th className="px-6 py-3 text-left label-sm">Trigger</th>
              <th className="px-6 py-3 text-left label-sm">Scheduled</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-left label-sm">Error</th>
            </tr>
          </thead>
          <tbody className="bg-neu-light divide-y divide-neu-dark">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                  No queue items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-neu-base transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body-sm font-medium text-text-primary no-margin">
                        {item.registration.email}
                      </p>
                      {(item.registration.firstName || item.registration.lastName) && (
                        <p className="text-body-xs text-text-secondary no-margin">
                          {[item.registration.firstName, item.registration.lastName]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm text-text-primary no-margin">
                      {item.notification?.webinar.title || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm text-text-secondary no-margin">
                      {item.notification
                        ? formatTrigger(
                            item.notification.triggerType,
                            item.notification.triggerMinutes
                          )
                        : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm text-text-secondary no-margin">
                      {formatDate(item.scheduledAt)}
                    </p>
                    {item.processedAt && (
                      <p className="text-body-xs text-text-muted no-margin">
                        Processed: {formatDate(item.processedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={queueStatusVariants[item.status]}>{item.status}</Badge>
                    {item.attempts > 1 && (
                      <span className="ml-2 text-body-xs text-text-muted">
                        ({item.attempts} attempts)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.lastError && (
                      <p
                        className="text-body-xs text-red-600 no-margin truncate max-w-[200px]"
                        title={item.lastError}
                      >
                        {item.lastError}
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-neu-light px-4 py-3 flex items-center justify-between border-t border-neu-dark">
            <div className="flex-1 flex items-center justify-between">
              <p className="text-body-sm text-secondary no-margin">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ===== Email Details Modal =====

function EmailDetails({ email, onClose }: { email: EmailLog; onClose: () => void }) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block label-sm mb-1">Recipient</label>
        <p className="no-margin">{email.to}</p>
      </div>

      <div>
        <label className="block label-sm mb-1">Subject</label>
        <p className="no-margin">{email.subject}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block label-sm mb-1">Category</label>
          <Badge variant={categoryVariants[email.category] || 'default'}>
            {email.category}
          </Badge>
        </div>
        <div>
          <label className="block label-sm mb-1">Type</label>
          <Badge variant={typeVariants[email.type] || 'default'}>
            {email.type.replace('_', ' ')}
          </Badge>
        </div>
        <div>
          <label className="block label-sm mb-1">Status</label>
          <Badge variant={statusVariants[email.status]}>
            {email.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div>
        <label className="block label-sm mb-1">Message ID</label>
        <p className="text-body-sm font-mono break-all no-margin">{email.messageId}</p>
      </div>

      <div className="border-t border-neu-dark pt-4">
        <h4 className="mb-3">Delivery Timeline</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-body-sm text-muted">Sent</span>
            <span className="text-body-sm">{formatDate(email.sentAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-sm text-muted">Delivered</span>
            <span className="text-body-sm">{formatDate(email.deliveredAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-sm text-muted">Opened</span>
            <span className="text-body-sm">{formatDate(email.openedAt)}</span>
          </div>
          {email.bouncedAt && (
            <div className="flex justify-between">
              <span className="text-body-sm text-primary-600">Bounced</span>
              <span className="text-body-sm text-primary-700">{formatDate(email.bouncedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {email.bounceType && (
        <div className="bg-primary-50 p-3 rounded-neu">
          <label className="block label-sm text-primary-700 mb-1">Bounce Reason</label>
          <p className="text-body-sm text-primary-600 no-margin">{email.bounceType}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
