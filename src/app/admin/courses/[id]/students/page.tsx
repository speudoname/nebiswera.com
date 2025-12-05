'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Users,
  Search,
  Download,
  Upload,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  MoreVertical,
  Eye,
  UserPlus,
  Mail,
} from 'lucide-react'

type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'SUSPENDED'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Enrollment {
  id: string
  userId: string
  status: EnrollmentStatus
  progressPercent: number
  enrolledAt: string
  completedAt: string | null
  expiresAt: string | null
  user: User
}

interface Course {
  id: string
  title: string
  slug: string
}

interface Stats {
  total: number
  active: number
  completed: number
  expired: number
  suspended: number
}

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Active', color: 'text-green-600 bg-green-100', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-blue-600 bg-blue-100', icon: CheckCircle },
  EXPIRED: { label: 'Expired', color: 'text-amber-600 bg-amber-100', icon: Clock },
  SUSPENDED: { label: 'Suspended', color: 'text-red-600 bg-red-100', icon: Pause },
}

export default function StudentsPage() {
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Enrollment | null>(null)
  const [statusChangeModal, setStatusChangeModal] = useState<{ enrollment: Enrollment; newStatus: EnrollmentStatus } | null>(null)

  // Enroll form
  const [enrollEmail, setEnrollEmail] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  useEffect(() => {
    if (course) {
      fetchEnrollments()
    }
  }, [course, statusFilter, searchQuery, page])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
      } else {
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      router.push('/admin/courses')
    }
  }

  const fetchEnrollments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/admin/courses/${courseId}/enrollments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollUser = async () => {
    if (!enrollEmail.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: enrollEmail.trim() }),
      })

      if (res.ok) {
        await fetchEnrollments()
        setEnrollModalOpen(false)
        setEnrollEmail('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to enroll user')
      }
    } catch (error) {
      console.error('Failed to enroll user:', error)
      alert('Failed to enroll user')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkImport = async () => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))

    if (emails.length === 0) {
      alert('No valid emails found')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })

      if (res.ok) {
        const data = await res.json()
        await fetchEnrollments()
        setBulkImportOpen(false)
        setBulkEmails('')
        alert(`Enrolled: ${data.enrolled}\nAlready enrolled: ${data.alreadyEnrolled}\nNot found: ${data.notFound}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to bulk enroll')
      }
    } catch (error) {
      console.error('Failed to bulk enroll:', error)
      alert('Failed to bulk enroll')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    if (!statusChangeModal) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments/${statusChangeModal.enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusChangeModal.newStatus }),
      })

      if (res.ok) {
        await fetchEnrollments()
        setStatusChangeModal(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchEnrollments()
        setDeleteConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete enrollment')
      }
    } catch (error) {
      console.error('Failed to delete enrollment:', error)
      alert('Failed to delete enrollment')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    window.open(`/api/admin/courses/${courseId}/enrollments/export`, '_blank')
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${courseId}`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary-600" />
              Students
            </h1>
            <p className="text-text-muted">{course.title}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="secondary" onClick={() => setBulkImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => setEnrollModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll Student
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-sm text-text-muted">Total Enrolled</div>
          </div>
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-text-muted">Active</div>
          </div>
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-text-muted">Completed</div>
          </div>
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.expired}</div>
            <div className="text-sm text-text-muted">Expired</div>
          </div>
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <div className="text-sm text-text-muted">Suspended</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-neu border-2 border-transparent bg-neu-base text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as EnrollmentStatus | ''); setPage(1); }}
          className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Enrollments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-16 bg-neu-light rounded-neu shadow-neu">
          <Users className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
          <p className="text-lg font-medium text-text-secondary mb-2">No students enrolled</p>
          <p className="text-text-muted mb-6">
            {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Enroll your first student to get started'}
          </p>
          {!searchQuery && !statusFilter && (
            <Button onClick={() => setEnrollModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll Student
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
          <table className="w-full">
            <thead className="bg-neu-base">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Student</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Progress</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Enrolled</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Expires</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neu-dark">
              {enrollments.map((enrollment) => {
                const statusConfig = STATUS_CONFIG[enrollment.status]
                const StatusIcon = statusConfig.icon
                return (
                  <tr key={enrollment.id} className="hover:bg-neu-base/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {enrollment.user.image ? (
                          <img
                            src={enrollment.user.image}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {(enrollment.user.name || enrollment.user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-text-primary">
                            {enrollment.user.name || 'Unnamed'}
                          </div>
                          <div className="text-sm text-text-muted">{enrollment.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-neu-base rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-muted">{enrollment.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {enrollment.expiresAt ? new Date(enrollment.expiresAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${courseId}/students/${enrollment.id}`}
                          className="p-1.5 text-text-muted hover:text-primary-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <div className="relative group">
                          <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neu-dark opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            {enrollment.status !== 'ACTIVE' && (
                              <button
                                onClick={() => setStatusChangeModal({ enrollment, newStatus: 'ACTIVE' })}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neu-base flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Set Active
                              </button>
                            )}
                            {enrollment.status !== 'COMPLETED' && (
                              <button
                                onClick={() => setStatusChangeModal({ enrollment, newStatus: 'COMPLETED' })}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neu-base flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                Mark Complete
                              </button>
                            )}
                            {enrollment.status !== 'SUSPENDED' && (
                              <button
                                onClick={() => setStatusChangeModal({ enrollment, newStatus: 'SUSPENDED' })}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neu-base flex items-center gap-2"
                              >
                                <Pause className="w-4 h-4 text-amber-600" />
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(enrollment)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neu-dark">
              <div className="text-sm text-text-muted">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enroll Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => { setEnrollModalOpen(false); setEnrollEmail(''); }}
        title="Enroll Student"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Student Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="email"
                value={enrollEmail}
                onChange={(e) => setEnrollEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-neu border-2 border-transparent bg-neu-base text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              User must have an account to be enrolled
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnrollUser} disabled={saving || !enrollEmail.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Enroll
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkImportOpen}
        onClose={() => { setBulkImportOpen(false); setBulkEmails(''); }}
        title="Bulk Import"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Addresses
            </label>
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder="Enter email addresses, one per line or comma-separated..."
              rows={8}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none font-mono text-sm"
            />
            <p className="mt-2 text-xs text-text-muted">
              Paste emails separated by commas, semicolons, or new lines. Only users with existing accounts will be enrolled.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setBulkImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={saving || !bulkEmails.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Change Confirmation */}
      <Modal
        isOpen={!!statusChangeModal}
        onClose={() => setStatusChangeModal(null)}
        title="Change Status"
      >
        <div className="text-center">
          <p className="text-text-secondary mb-6">
            Change status for <strong>{statusChangeModal?.enrollment.user.name || statusChangeModal?.enrollment.user.email}</strong> to <strong>{statusChangeModal?.newStatus}</strong>?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setStatusChangeModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Remove Enrollment"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-text-secondary mb-2">
            Remove <strong>{deleteConfirm?.user.name || deleteConfirm?.user.email}</strong> from this course?
          </p>
          <p className="text-sm text-text-muted mb-6">
            This will delete all their progress and cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteEnrollment} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
