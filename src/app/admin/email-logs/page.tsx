'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input } from '@/components/ui'

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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusColors: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  BOUNCED: 'bg-red-100 text-red-800',
  SPAM_COMPLAINT: 'bg-red-100 text-red-800',
  OPENED: 'bg-purple-100 text-purple-800',
}

const typeColors: Record<string, string> = {
  VERIFICATION: 'bg-indigo-100 text-indigo-800',
  PASSWORD_RESET: 'bg-yellow-100 text-yellow-800',
  WELCOME: 'bg-green-100 text-green-800',
}

export default function EmailLogsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
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

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              id="search"
              name="search"
              type="text"
              label="Search"
              placeholder="Search by email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="BOUNCED">Bounced</option>
              <option value="SPAM_COMPLAINT">Spam Complaint</option>
              <option value="OPENED">Opened</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="VERIFICATION">Verification</option>
              <option value="PASSWORD_RESET">Password Reset</option>
              <option value="WELCOME">Welcome</option>
            </select>
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

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
                <tr key={email.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {email.to}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {email.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[email.type]}`}
                    >
                      {email.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[email.status]}`}
                    >
                      {email.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(email.sentAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedEmail(email)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Details Modal */}
      {selectedEmail && (
        <EmailDetailsModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  )
}

function EmailDetailsModal({
  email,
  onClose,
}: {
  email: EmailLog
  onClose: () => void
}) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Email Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Recipient
            </label>
            <p className="text-gray-900">{email.to}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Subject
            </label>
            <p className="text-gray-900">{email.subject}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Type
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[email.type]}`}
              >
                {email.type.replace('_', ' ')}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[email.status]}`}
              >
                {email.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Message ID
            </label>
            <p className="text-gray-900 text-sm font-mono break-all">
              {email.messageId}
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Delivery Timeline
            </h3>
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
              <label className="block text-sm font-medium text-red-700">
                Bounce Reason
              </label>
              <p className="text-sm text-red-600">{email.bounceType}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
