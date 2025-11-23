'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Modal, Pagination, Badge } from '@/components/ui'
import { FilterBar, EmailLogRow } from '@/components/admin'

interface EmailLog {
  id: string
  messageId: string
  to: string
  subject: string
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'WELCOME'
  status: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'SPAM_COMPLAINT' | 'OPENED'
  locale: string
  sentAt: string
  deliveredAt: string | null
  openedAt: string | null
  bouncedAt: string | null
  bounceType: string | null
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
  SENT: 'info',
  DELIVERED: 'success',
  BOUNCED: 'error',
  SPAM_COMPLAINT: 'error',
  OPENED: 'info',
}

const typeVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
  VERIFICATION: 'info',
  PASSWORD_RESET: 'warning',
  WELCOME: 'success',
}

export default function EmailLogsPage() {
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
  }, [pagination.page, pagination.limit, search, status, type])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchEmails()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        searchPlaceholder="Search by email address..."
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
            ],
          },
        ]}
      />

      {/* Email Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex items-center justify-between">
              <p className="text-sm text-gray-700">
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
    </div>
  )
}

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
        <label className="block text-sm font-medium text-gray-500">Recipient</label>
        <p className="text-gray-900">{email.to}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500">Subject</label>
        <p className="text-gray-900">{email.subject}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Type</label>
          <Badge variant={typeVariants[email.type]}>
            {email.type.replace('_', ' ')}
          </Badge>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Status</label>
          <Badge variant={statusVariants[email.status]}>
            {email.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500">Message ID</label>
        <p className="text-gray-900 text-sm font-mono break-all">{email.messageId}</p>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Delivery Timeline</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Sent</span>
            <span className="text-sm text-gray-900">{formatDate(email.sentAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Delivered</span>
            <span className="text-sm text-gray-900">{formatDate(email.deliveredAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Opened</span>
            <span className="text-sm text-gray-900">{formatDate(email.openedAt)}</span>
          </div>
          {email.bouncedAt && (
            <div className="flex justify-between">
              <span className="text-sm text-red-500">Bounced</span>
              <span className="text-sm text-red-900">{formatDate(email.bouncedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {email.bounceType && (
        <div className="bg-red-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-red-700">Bounce Reason</label>
          <p className="text-sm text-red-600">{email.bounceType}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
