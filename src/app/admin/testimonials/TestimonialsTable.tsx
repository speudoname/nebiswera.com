'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Edit, Trash2, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type TestimonialStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type TestimonialType = 'TEXT' | 'AUDIO' | 'VIDEO'

type Testimonial = {
  id: string
  name: string
  email: string | null
  text: string
  rating: number
  status: TestimonialStatus
  type: TestimonialType
  locale: string
  submittedAt: string
  source: string | null
  tags: string[]
}

export function TestimonialsTable() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<TestimonialStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<TestimonialType | 'ALL'>('ALL')
  const [tagFilter, setTagFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    fetchTestimonials()
  }, [page, statusFilter, typeFilter, tagFilter, searchQuery])

  useEffect(() => {
    // Fetch available tags from all testimonials
    async function fetchTags() {
      try {
        const res = await fetch('/api/testimonials?limit=1000')
        const data = await res.json()
        const allTags = new Set<string>()
        data.testimonials.forEach((t: Testimonial) => {
          t.tags.forEach(tag => allTags.add(tag))
        })
        setAvailableTags(Array.from(allTags).sort())
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

  async function fetchTestimonials() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      if (tagFilter !== 'ALL') params.set('tags', tagFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/testimonials?${params}`)
      const data = await res.json()
      setTestimonials(data.testimonials)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      await fetch(`/api/testimonials/${id}/approve`, { method: 'PATCH' })
      fetchTestimonials()
    } catch (error) {
      console.error('Error approving testimonial:', error)
    }
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/testimonials/${id}/reject`, { method: 'PATCH' })
      fetchTestimonials()
    } catch (error) {
      console.error('Error rejecting testimonial:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
      fetchTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
    }
  }

  const statusColors: Record<TestimonialStatus, 'warning' | 'success' | 'error'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or text..."
            className="w-full pl-10 pr-4 py-2 rounded-neu bg-neu-base shadow-neu-inset text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-neu bg-neu-base shadow-neu-inset text-sm"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-text-secondary">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-neu bg-neu-base shadow-neu-inset text-sm"
          >
            <option value="ALL">All</option>
            <option value="TEXT">Text</option>
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-text-secondary">Tag:</span>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-neu bg-neu-base shadow-neu-inset text-sm"
          >
            <option value="ALL">All</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-text-secondary">
          Total: {total} testimonials
        </div>
      </div>

      {/* Table */}
      <div className="bg-neu-base rounded-neu-lg shadow-neu overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neu-dark">
                <th className="text-left py-4 px-4 font-semibold text-text-primary">Name</th>
                <th className="text-left py-4 px-4 font-semibold text-text-primary">Text</th>
                <th className="text-left py-4 px-4 font-semibold text-text-primary">Tags</th>
                <th className="text-left py-4 px-4 font-semibold text-text-primary">Type</th>
                <th className="text-left py-4 px-4 font-semibold text-text-primary">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-text-primary">Date</th>
                <th className="text-right py-4 px-4 font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="border-b border-neu-dark/50 hover:bg-neu-light/50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-text-primary">{t.name}</div>
                    {t.email && <div className="text-xs text-text-secondary">{t.email}</div>}
                  </td>
                  <td className="py-4 px-4 max-w-md">
                    <div className="text-sm text-text-secondary truncate">{t.text}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {t.tags.map((tag, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {t.tags.length === 0 && <span className="text-xs text-text-secondary">-</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="default" size="sm">{t.type}</Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={statusColors[t.status]} size="sm">{t.status}</Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-secondary">
                    {new Date(t.submittedAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2 justify-end">
                      {t.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="p-2 rounded-neu bg-neu-base shadow-neu hover:shadow-neu-hover text-green-600"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            className="p-2 rounded-neu bg-neu-base shadow-neu hover:shadow-neu-hover text-red-600"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => router.push(`/admin/testimonials/${t.id}`)}
                        className="p-2 rounded-neu bg-neu-base shadow-neu hover:shadow-neu-hover text-primary-600"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 rounded-neu bg-neu-base shadow-neu hover:shadow-neu-hover text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-text-secondary">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
