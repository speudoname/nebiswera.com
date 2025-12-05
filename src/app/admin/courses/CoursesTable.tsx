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
  Copy,
  ExternalLink,
  Users,
  BookOpen,
  Layers,
  BarChart3,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react'

type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type CourseAccessType = 'OPEN' | 'FREE' | 'PAID'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  locale: string
  accessType: CourseAccessType
  price: number | null
  currency: string | null
  status: CourseStatus
  version: number
  createdAt: string
  publishedAt: string | null
  _count: {
    modules: number
    lessons: number
    enrollments: number
  }
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function CoursesTable() {
  const [courses, setCourses] = useState<Course[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all')
  const [accessFilter, setAccessFilter] = useState<CourseAccessType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (accessFilter !== 'all') params.set('accessType', accessFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/courses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, accessFilter, search])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCourses()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        setCourses(prev => prev.filter(c => c.id !== id))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
        fetchCourses()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Failed to delete course:', error)
      alert('Failed to delete course')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/courses/${id}/duplicate`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchCourses()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to duplicate course')
      }
    } catch (error) {
      console.error('Failed to duplicate course:', error)
      alert('Failed to duplicate course')
    }
  }

  const getStatusBadge = (status: CourseStatus) => {
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

  const getAccessBadge = (accessType: CourseAccessType) => {
    const config = {
      OPEN: { bg: 'bg-blue-100 text-blue-700', icon: Globe, label: 'Open' },
      FREE: { bg: 'bg-green-100 text-green-700', icon: Unlock, label: 'Free' },
      PAID: { bg: 'bg-purple-100 text-purple-700', icon: Lock, label: 'Paid' },
    }
    const { bg, icon: Icon, label } = config[accessType]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${bg}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
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
              placeholder="Search courses..."
              className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CourseStatus | 'all')
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={accessFilter}
            onChange={(e) => {
              setAccessFilter(e.target.value as CourseAccessType | 'all')
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="all">All Access Types</option>
            <option value="OPEN">Open</option>
            <option value="FREE">Free</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <Link href="/admin/courses/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </Link>
      </div>

      {/* Courses Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">Course</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-left label-sm">Access</th>
              <th className="px-6 py-3 text-center label-sm">Content</th>
              <th className="px-6 py-3 text-right label-sm">Students</th>
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
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                  {search || statusFilter !== 'all' || accessFilter !== 'all'
                    ? 'No courses found matching your filters'
                    : 'No courses yet. Create your first course!'}
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-neu-base/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-text-primary">{course.title}</div>
                        <div className="text-sm text-text-muted">
                          <span className="font-mono text-xs">{course.slug}</span>
                          <span className="ml-2 text-xs uppercase">{course.locale}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                  <td className="px-6 py-4">
                    {getAccessBadge(course.accessType)}
                    {course.accessType === 'PAID' && course.price && (
                      <div className="text-xs text-text-muted mt-1">
                        {course.price} {course.currency}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1" title="Modules">
                        <Layers className="w-4 h-4 text-text-muted" />
                        {course._count.modules}
                      </div>
                      <div className="flex items-center gap-1" title="Lessons">
                        <BookOpen className="w-4 h-4 text-text-muted" />
                        {course._count.lessons}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="w-3 h-3 text-text-muted" />
                      {course._count.enrollments.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {formatDate(course.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Analytics */}
                      <Link
                        href={`/admin/courses/${course.id}/analytics`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      {/* Students */}
                      <Link
                        href={`/admin/courses/${course.id}/students`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Students"
                      >
                        <Users className="w-4 h-4" />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(course.id)}
                        className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Preview (only if published) */}
                      {course.status === 'PUBLISHED' && (
                        <a
                          href={`/${course.locale}/courses/${course.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                          title="Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      {/* Delete (only for DRAFT or ARCHIVED) */}
                      {(course.status === 'DRAFT' || course.status === 'ARCHIVED') && (
                        <button
                          onClick={() => setDeleteConfirm(course.id)}
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
        title="Delete Course"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          Are you sure you want to delete this course? This will also delete all modules,
          lessons, parts, and quizzes. This action cannot be undone.
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
