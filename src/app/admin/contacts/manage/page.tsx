'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Input, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertTriangle,
  Edit2,
  Trash2,
  Tag,
  Filter,
  Users,
} from 'lucide-react'

// Tag interfaces
interface Tag {
  id: string
  name: string
  color: string
  description: string | null
  contactCount: number
  createdAt: string
}

// Segment interfaces
interface Segment {
  id: string
  name: string
  description: string | null
  filters: Record<string, unknown>
  contactCount: number
  createdAt: string
}

const PRESET_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
]

type TabType = 'tags' | 'segments'

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('tags')

  // Tags state
  const [tags, setTags] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [createTagModalOpen, setCreateTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deleteTagConfirm, setDeleteTagConfirm] = useState<Tag | null>(null)

  // Segments state
  const [segments, setSegments] = useState<Segment[]>([])
  const [segmentsLoading, setSegmentsLoading] = useState(true)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [deleteSegmentConfirm, setDeleteSegmentConfirm] = useState<Segment | null>(null)

  // Fetch tags
  const fetchTags = async () => {
    setTagsLoading(true)
    try {
      const res = await fetch('/api/admin/contacts/tags')
      const data = await res.json()
      setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  // Fetch segments
  const fetchSegments = async () => {
    setSegmentsLoading(true)
    try {
      const res = await fetch('/api/admin/contacts/segments')
      const data = await res.json()
      setSegments(data)
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    } finally {
      setSegmentsLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
    fetchSegments()
  }, [])

  // Tag handlers
  const handleDeleteTag = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/tags/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteTagConfirm(null)
        fetchTags()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete tag')
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
      alert('Failed to delete tag')
    }
  }

  // Segment handlers
  const handleDeleteSegment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/segments/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteSegmentConfirm(null)
        fetchSegments()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete segment')
      }
    } catch (error) {
      console.error('Failed to delete segment:', error)
      alert('Failed to delete segment')
    }
  }

  return (
    <div>
      <Link
        href="/admin/contacts"
        className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Contacts
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="no-margin">Manage</h1>
        {activeTab === 'tags' && (
          <Button onClick={() => setCreateTagModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tag
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-neu-base rounded-neu w-fit">
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-neu text-sm font-medium transition-all ${
            activeTab === 'tags'
              ? 'bg-neu-light shadow-neu text-primary-600'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Tag className="w-4 h-4" />
          Tags
          <span className="text-xs bg-neu-dark/30 px-2 py-0.5 rounded-full">
            {tags.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('segments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-neu text-sm font-medium transition-all ${
            activeTab === 'segments'
              ? 'bg-neu-light shadow-neu text-primary-600'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Filter className="w-4 h-4" />
          Segments
          <span className="text-xs bg-neu-dark/30 px-2 py-0.5 rounded-full">
            {segments.length}
          </span>
        </button>
      </div>

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
          {tagsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="mb-4">No tags created yet</p>
              <Button onClick={() => setCreateTagModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Tag
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neu-dark">
              <thead className="bg-neu-light">
                <tr>
                  <th className="px-6 py-3 text-left label-sm">Tag</th>
                  <th className="px-6 py-3 text-left label-sm">Description</th>
                  <th className="px-6 py-3 text-left label-sm">Contacts</th>
                  <th className="px-6 py-3 text-left label-sm">Created</th>
                  <th className="px-6 py-3 text-right label-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-neu-light divide-y divide-neu-dark">
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {tag.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tag.contactCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {new Date(tag.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingTag(tag)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTagConfirm(tag)}
                        className="text-primary-700 hover:text-primary-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
          {segmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="mb-2">No segments created yet</p>
              <p className="text-sm mb-4">
                Create segments from the Contacts page by applying filters and clicking &quot;Save as Segment&quot;
              </p>
              <Link href="/admin/contacts">
                <Button variant="secondary">Go to Contacts</Button>
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neu-dark">
              <thead className="bg-neu-light">
                <tr>
                  <th className="px-6 py-3 text-left label-sm">Segment</th>
                  <th className="px-6 py-3 text-left label-sm">Description</th>
                  <th className="px-6 py-3 text-left label-sm">Filters</th>
                  <th className="px-6 py-3 text-left label-sm">Contacts</th>
                  <th className="px-6 py-3 text-left label-sm">Created</th>
                  <th className="px-6 py-3 text-right label-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-neu-light divide-y divide-neu-dark">
                {segments.map((segment) => (
                  <tr key={segment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-text-primary">
                        {segment.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">
                      {segment.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      <FilterSummary filters={segment.filters} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {segment.contactCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {new Date(segment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingSegment(segment)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteSegmentConfirm(segment)}
                        className="text-primary-700 hover:text-primary-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tag Create Modal */}
      {createTagModalOpen && (
        <TagFormModal
          onClose={() => setCreateTagModalOpen(false)}
          onSuccess={() => {
            setCreateTagModalOpen(false)
            fetchTags()
          }}
        />
      )}

      {/* Tag Edit Modal */}
      {editingTag && (
        <TagFormModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSuccess={() => {
            setEditingTag(null)
            fetchTags()
          }}
        />
      )}

      {/* Tag Delete Confirmation */}
      <Modal
        isOpen={!!deleteTagConfirm}
        onClose={() => setDeleteTagConfirm(null)}
        title="Delete Tag"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-text-secondary text-center mb-2">
          Are you sure you want to delete the tag &quot;{deleteTagConfirm?.name}&quot;?
        </p>
        {deleteTagConfirm && deleteTagConfirm.contactCount > 0 && (
          <p className="text-sm text-amber-600 text-center mb-4">
            This tag is used by {deleteTagConfirm.contactCount} contact(s). It will be removed from all contacts.
          </p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={() => setDeleteTagConfirm(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => deleteTagConfirm && handleDeleteTag(deleteTagConfirm.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Segment Edit Modal */}
      {editingSegment && (
        <SegmentFormModal
          segment={editingSegment}
          onClose={() => setEditingSegment(null)}
          onSuccess={() => {
            setEditingSegment(null)
            fetchSegments()
          }}
        />
      )}

      {/* Segment Delete Confirmation */}
      <Modal
        isOpen={!!deleteSegmentConfirm}
        onClose={() => setDeleteSegmentConfirm(null)}
        title="Delete Segment"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-text-secondary text-center mb-2">
          Are you sure you want to delete the segment &quot;{deleteSegmentConfirm?.name}&quot;?
        </p>
        <p className="text-sm text-text-muted text-center mb-4">
          This will only remove the saved segment. Contacts will not be affected.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={() => setDeleteSegmentConfirm(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => deleteSegmentConfirm && handleDeleteSegment(deleteSegmentConfirm.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// Filter summary component
function FilterSummary({ filters }: { filters: Record<string, unknown> }) {
  const parts: string[] = []

  if (filters.status && filters.status !== 'all') {
    parts.push(`Status: ${filters.status}`)
  }
  if (filters.source && filters.source !== 'all') {
    parts.push(`Source: ${filters.source}`)
  }
  if (filters.tagIds && Array.isArray(filters.tagIds) && filters.tagIds.length > 0) {
    parts.push(`${filters.tagIds.length} tag(s)`)
  }
  if (filters.search) {
    parts.push(`Search: "${filters.search}"`)
  }

  if (parts.length === 0) {
    return <span className="text-text-muted">No filters</span>
  }

  return (
    <span className="text-xs">
      {parts.slice(0, 2).join(', ')}
      {parts.length > 2 && ` +${parts.length - 2} more`}
    </span>
  )
}

// Tag Form Modal
function TagFormModal({
  tag,
  onClose,
  onSuccess,
}: {
  tag?: Tag
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    color: tag?.color || PRESET_COLORS[0],
    description: tag?.description || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = tag
        ? `/api/admin/contacts/tags/${tag.id}`
        : '/api/admin/contacts/tags'
      const method = tag ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save tag')
      }
    } catch (err) {
      setError('Failed to save tag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={tag ? 'Edit Tag' : 'Create Tag'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">
            {error}
          </div>
        )}

        <Input
          id="name"
          name="name"
          label="Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full transition-all ${
                  formData.color === color
                    ? 'ring-2 ring-offset-2 ring-primary-400 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-text-muted">Custom:</span>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <span className="text-sm text-text-muted">{formData.color}</span>
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">
            Preview
          </label>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${formData.color}20`,
              color: formData.color,
            }}
          >
            {formData.name || 'Tag name'}
          </span>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            placeholder="Optional description for this tag"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {tag ? 'Save Changes' : 'Create Tag'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Segment Form Modal (edit only)
function SegmentFormModal({
  segment,
  onClose,
  onSuccess,
}: {
  segment: Segment
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: segment.name,
    description: segment.description || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/contacts/segments/${segment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save segment')
      }
    } catch (err) {
      setError('Failed to save segment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Segment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">
            {error}
          </div>
        )}

        <Input
          id="name"
          name="name"
          label="Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            placeholder="Optional description"
          />
        </div>

        <div className="p-3 bg-neu-base rounded-neu">
          <p className="text-sm text-text-muted mb-2">Current filters:</p>
          <FilterSummary filters={segment.filters} />
          <p className="text-xs text-text-muted mt-2">
            To change filters, delete this segment and create a new one from the Contacts page.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
