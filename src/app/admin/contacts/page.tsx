'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button, Input, Modal, Pagination } from '@/components/ui'
import { FilterBar, ContactRow, TagBadge } from '../components'
import {
  AlertTriangle,
  Loader2,
  Plus,
  Upload,
  Download,
  Trash2,
  Tags,
  Archive,
  CheckSquare,
  Square,
  MinusSquare,
  Save,
  X,
  Filter,
  Settings,
} from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
}

interface Segment {
  id: string
  name: string
  description: string | null
  filters: Record<string, unknown>
  contactCount: number
}

interface Contact {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  source: string
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'
  createdAt: string
  tags: Tag[]
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

type BulkAction = 'addTags' | 'removeTags' | 'changeStatus' | 'delete'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')
  const [selectedTag, setSelectedTag] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAllMatching, setSelectAllMatching] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [bulkTags, setBulkTags] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<Contact['status']>('ACTIVE')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkNewTags, setBulkNewTags] = useState<{ name: string; color: string }[]>([])
  const [bulkNewTagInput, setBulkNewTagInput] = useState('')
  const [bulkNewTagColor, setBulkNewTagColor] = useState('#8B5CF6')

  // Segment state
  const [saveSegmentOpen, setSaveSegmentOpen] = useState(false)
  const [segmentName, setSegmentName] = useState('')
  const [segmentDescription, setSegmentDescription] = useState('')
  const [savingSegment, setSavingSegment] = useState(false)

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts/tags')
      const data = await res.json()
      setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }, [])

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts/segments')
      const data = await res.json()
      setSegments(data)
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    }
  }, [])

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status,
        source,
        tagId: selectedTag,
      })
      const res = await fetch(`/api/admin/contacts?${params}`)
      const data = await res.json()
      setContacts(data.contacts)
      setSources(data.sources || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, status, source, selectedTag])

  useEffect(() => {
    fetchTags()
    fetchSegments()
  }, [fetchTags, fetchSegments])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set())
    setSelectAllMatching(false)
  }, [search, status, source, selectedTag, pagination.page, pagination.limit])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchContacts()
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchContacts()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete contact')
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
      alert('Failed to delete contact')
    }
  }

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return

    setBulkLoading(true)
    try {
      // If adding tags and there are new tags to create, create them first
      let allTagIds = [...bulkTags]
      if (bulkAction === 'addTags' && bulkNewTags.length > 0) {
        for (const newTag of bulkNewTags) {
          const createRes = await fetch('/api/admin/contacts/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTag),
          })
          if (createRes.ok) {
            const createdTag = await createRes.json()
            allTagIds.push(createdTag.id)
          }
        }
        // Refresh tags list
        fetchTags()
      }

      const res = await fetch('/api/admin/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: selectAllMatching ? undefined : Array.from(selectedIds),
          selectAllMatching,
          filters: selectAllMatching ? { search, status, source, tagId: selectedTag } : undefined,
          action: bulkAction,
          tagIds: allTagIds,
          status: bulkStatus,
        }),
      })

      if (res.ok) {
        setBulkModalOpen(false)
        setBulkAction(null)
        setBulkTags([])
        setBulkNewTags([])
        setBulkNewTagInput('')
        setSelectedIds(new Set())
        setSelectAllMatching(false)
        fetchContacts()
      } else {
        const data = await res.json()
        alert(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Bulk operation failed:', error)
      alert('Operation failed')
    } finally {
      setBulkLoading(false)
    }
  }

  const openBulkModal = (action: BulkAction) => {
    setBulkAction(action)
    setBulkModalOpen(true)
  }

  // Save current filters as segment
  const handleSaveSegment = async () => {
    if (!segmentName.trim()) return

    setSavingSegment(true)
    try {
      const filters = {
        status: status !== 'all' ? status : undefined,
        source: source !== 'all' ? source : undefined,
        tagIds: selectedTag ? [selectedTag] : undefined,
        search: search || undefined,
      }

      const res = await fetch('/api/admin/contacts/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDescription,
          filters,
        }),
      })

      if (res.ok) {
        setSaveSegmentOpen(false)
        setSegmentName('')
        setSegmentDescription('')
        fetchSegments()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save segment')
      }
    } catch (error) {
      console.error('Failed to save segment:', error)
      alert('Failed to save segment')
    } finally {
      setSavingSegment(false)
    }
  }

  const loadSegment = (segment: Segment) => {
    const filters = segment.filters as {
      status?: string
      source?: string
      tagIds?: string[]
      search?: string
    }

    setStatus(filters.status || 'all')
    setSource(filters.source || 'all')
    setSelectedTag(filters.tagIds?.[0] || '')
    setSearch(filters.search || '')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleExport = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      format,
      status,
      tagId: selectedTag,
    })
    window.location.href = `/api/admin/contacts/export?${params}`
  }

  const hasActiveFilters = status !== 'all' || source !== 'all' || selectedTag || search

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="no-margin">Contacts</h1>
        <div className="flex gap-2">
          <Link href="/admin/contacts/manage">
            <Button variant="secondary">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </Link>
          <Link href="/admin/contacts/import">
            <Button variant="secondary">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </Link>
          <div className="relative group">
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="absolute right-0 mt-1 w-32 bg-neu-light rounded-neu shadow-neu opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-neu-base"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-neu-base"
              >
                Export JSON
              </button>
            </div>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Segments */}
      {segments.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Segments:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {segments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => loadSegment(segment)}
                className="px-3 py-1.5 bg-neu-base rounded-neu text-sm hover:bg-neu-dark/30 transition-colors"
              >
                {segment.name}
                <span className="ml-2 text-xs text-text-muted">
                  ({segment.contactCount})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        searchPlaceholder="Search by name, email, or phone..."
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
              { value: 'ACTIVE', label: 'Active' },
              { value: 'UNSUBSCRIBED', label: 'Unsubscribed' },
              { value: 'BOUNCED', label: 'Bounced' },
              { value: 'ARCHIVED', label: 'Archived' },
            ],
          },
          {
            name: 'source',
            label: 'Source',
            value: source,
            onChange: (value) => {
              setSource(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All Sources' },
              ...sources.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            name: 'tag',
            label: 'Tag',
            value: selectedTag,
            onChange: (value) => {
              setSelectedTag(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: '', label: 'All Tags' },
              ...tags.map((t) => ({ value: t.id, label: t.name })),
            ],
          },
        ]}
      />

      {/* Save Segment Button */}
      {hasActiveFilters && (
        <div className="mb-4">
          <Button
            variant="secondary"
            onClick={() => setSaveSegmentOpen(true)}
            className="text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Segment
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-neu flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-700">
              {selectAllMatching
                ? `All ${pagination.total} matching contacts selected`
                : `${selectedIds.size} contact${selectedIds.size !== 1 ? 's' : ''} selected`}
            </span>
            {/* Show option to select all matching when all visible are selected */}
            {selectedIds.size === contacts.length && pagination.total > contacts.length && !selectAllMatching && (
              <button
                onClick={() => setSelectAllMatching(true)}
                className="text-sm text-primary-600 underline hover:text-primary-700"
              >
                Select all {pagination.total} matching contacts
              </button>
            )}
            {selectAllMatching && (
              <button
                onClick={() => setSelectAllMatching(false)}
                className="text-sm text-primary-600 underline hover:text-primary-700"
              >
                Select only this page
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => openBulkModal('addTags')}
              className="text-sm"
            >
              <Tags className="w-4 h-4 mr-1" />
              Add Tags
            </Button>
            <Button
              variant="secondary"
              onClick={() => openBulkModal('removeTags')}
              className="text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Remove Tags
            </Button>
            <Button
              variant="secondary"
              onClick={() => openBulkModal('changeStatus')}
              className="text-sm"
            >
              <Archive className="w-4 h-4 mr-1" />
              Change Status
            </Button>
            <Button
              variant="danger"
              onClick={() => openBulkModal('delete')}
              className="text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="text-text-muted hover:text-text-primary"
                >
                  {selectedIds.size === 0 ? (
                    <Square className="w-5 h-5" />
                  ) : selectedIds.size === contacts.length ? (
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                  ) : (
                    <MinusSquare className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left label-sm">Contact</th>
              <th className="px-6 py-3 text-left label-sm">Phone</th>
              <th className="px-6 py-3 text-left label-sm">Tags</th>
              <th className="px-6 py-3 text-left label-sm">Source</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-left label-sm">Created</th>
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
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                  No contacts found
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelect(contact.id)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      {selectedIds.has(contact.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <ContactRow
                    contact={contact}
                    onEdit={() => (window.location.href = `/admin/contacts/${contact.id}`)}
                    onDelete={() => setDeleteConfirm(contact.id)}
                    hideFirstColumn
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
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
                    page: 1, // Reset to first page when changing limit
                  }))
                }}
                className="rounded-neu border-2 border-transparent bg-neu-base px-2 py-1 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          {pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <CreateContactModal
          tags={tags}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false)
            fetchContacts()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Contact"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          Are you sure you want to delete this contact? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => {
          setBulkModalOpen(false)
          setBulkAction(null)
          setBulkTags([])
          setBulkNewTags([])
          setBulkNewTagInput('')
        }}
        title={
          bulkAction === 'addTags'
            ? 'Add Tags'
            : bulkAction === 'removeTags'
            ? 'Remove Tags'
            : bulkAction === 'changeStatus'
            ? 'Change Status'
            : 'Delete Contacts'
        }
      >
        {(bulkAction === 'addTags' || bulkAction === 'removeTags') && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              {bulkAction === 'addTags' ? 'Select tags to add:' : 'Select tags to remove:'}
            </p>
            {/* Existing tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (bulkTags.includes(tag.id)) {
                      setBulkTags(bulkTags.filter((t) => t !== tag.id))
                    } else {
                      setBulkTags([...bulkTags, tag.id])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    bulkTags.includes(tag.id)
                      ? 'ring-2 ring-offset-1'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    ['--tw-ring-color' as string]: tag.color,
                  } as React.CSSProperties}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            {/* Create new tag - only for addTags */}
            {bulkAction === 'addTags' && (
              <>
                {/* New tags to be created */}
                {bulkNewTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bulkNewTags.map((tag) => (
                      <span
                        key={tag.name}
                        className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => setBulkNewTags(bulkNewTags.filter((t) => t.name !== tag.name))}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add new tag input */}
                <div className="pt-2 border-t border-neu-dark">
                  <p className="text-xs text-text-muted mb-2">Or create a new tag:</p>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={bulkNewTagColor}
                      onChange={(e) => setBulkNewTagColor(e.target.value)}
                      className="w-9 h-9 rounded-neu border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bulkNewTagInput}
                      onChange={(e) => setBulkNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && bulkNewTagInput.trim()) {
                          e.preventDefault()
                          const exists = tags.some(
                            (t) => t.name.toLowerCase() === bulkNewTagInput.trim().toLowerCase()
                          )
                          const existsInNew = bulkNewTags.some(
                            (t) => t.name.toLowerCase() === bulkNewTagInput.trim().toLowerCase()
                          )
                          if (!exists && !existsInNew) {
                            setBulkNewTags([...bulkNewTags, { name: bulkNewTagInput.trim(), color: bulkNewTagColor }])
                          }
                          setBulkNewTagInput('')
                        }
                      }}
                      placeholder="New tag name..."
                      className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (bulkNewTagInput.trim()) {
                          const exists = tags.some(
                            (t) => t.name.toLowerCase() === bulkNewTagInput.trim().toLowerCase()
                          )
                          const existsInNew = bulkNewTags.some(
                            (t) => t.name.toLowerCase() === bulkNewTagInput.trim().toLowerCase()
                          )
                          if (!exists && !existsInNew) {
                            setBulkNewTags([...bulkNewTags, { name: bulkNewTagInput.trim(), color: bulkNewTagColor }])
                          }
                          setBulkNewTagInput('')
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {bulkAction === 'changeStatus' && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">Select new status:</p>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as Contact['status'])}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="BOUNCED">Bounced</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        )}

        {bulkAction === 'delete' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-text-secondary text-center">
              Are you sure you want to delete {selectedIds.size} contact
              {selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setBulkModalOpen(false)
              setBulkAction(null)
              setBulkTags([])
              setBulkNewTags([])
              setBulkNewTagInput('')
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={bulkAction === 'delete' ? 'danger' : 'primary'}
            onClick={handleBulkAction}
            loading={bulkLoading}
            disabled={
              (bulkAction === 'addTags' && bulkTags.length === 0 && bulkNewTags.length === 0) ||
              (bulkAction === 'removeTags' && bulkTags.length === 0)
            }
          >
            {bulkAction === 'delete'
              ? 'Delete'
              : bulkAction === 'addTags'
              ? 'Add Tags'
              : bulkAction === 'removeTags'
              ? 'Remove Tags'
              : 'Update Status'}
          </Button>
        </div>
      </Modal>

      {/* Save Segment Modal */}
      <Modal
        isOpen={saveSegmentOpen}
        onClose={() => {
          setSaveSegmentOpen(false)
          setSegmentName('')
          setSegmentDescription('')
        }}
        title="Save as Segment"
      >
        <div className="space-y-4">
          <Input
            id="segmentName"
            name="segmentName"
            label="Segment Name *"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="e.g., Active Newsletter Subscribers"
          />
          <div>
            <label className="block text-body-sm font-medium text-secondary mb-1">
              Description
            </label>
            <textarea
              value={segmentDescription}
              onChange={(e) => setSegmentDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
          <div className="p-3 bg-neu-base rounded-neu text-sm">
            <p className="text-text-muted mb-2">Current filters:</p>
            <ul className="space-y-1 text-text-secondary">
              {status !== 'all' && <li>Status: {status}</li>}
              {source !== 'all' && <li>Source: {source}</li>}
              {selectedTag && (
                <li>Tag: {tags.find((t) => t.id === selectedTag)?.name}</li>
              )}
              {search && <li>Search: &quot;{search}&quot;</li>}
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSaveSegmentOpen(false)
              setSegmentName('')
              setSegmentDescription('')
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveSegment}
            loading={savingSegment}
            disabled={!segmentName.trim()}
          >
            Save Segment
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function CreateContactModal({
  tags,
  onClose,
  onSuccess,
}: {
  tags: Tag[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    source: 'manual',
    sourceDetails: '',
    notes: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTags,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create contact')
      }
    } catch (err) {
      setError('Failed to create contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Contact">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">{error}</div>
        )}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email *"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <Input
            id="lastName"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>

        <Input
          id="phone"
          name="phone"
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-secondary mb-1">
              Source *
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              required
            >
              <option value="manual">Manual</option>
              <option value="newsletter">Newsletter</option>
              <option value="webinar">Webinar</option>
              <option value="import">Import</option>
              <option value="website">Website</option>
            </select>
          </div>
          <Input
            id="sourceDetails"
            name="sourceDetails"
            label="Source Details"
            placeholder="e.g., Webinar name"
            value={formData.sourceDetails}
            onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 p-2 bg-neu-base rounded-neu shadow-neu-inset min-h-[40px]">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  if (selectedTags.includes(tag.id)) {
                    setSelectedTags(selectedTags.filter((t) => t !== tag.id))
                  } else {
                    setSelectedTags([...selectedTags, tag.id])
                  }
                }}
                className={`px-2 py-1 rounded-full text-xs transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'ring-2 ring-offset-1'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  ['--tw-ring-color' as string]: tag.color,
                } as React.CSSProperties}
              >
                {tag.name}
              </button>
            ))}
            {tags.length === 0 && (
              <span className="text-text-muted text-sm">No tags available</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Contact
          </Button>
        </div>
      </form>
    </Modal>
  )
}
