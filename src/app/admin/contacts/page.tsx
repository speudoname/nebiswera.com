'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, Input, Modal, Pagination } from '@/components/ui'
import { FilterBar, ContactRow } from '../components'
import { useContactsData, useBulkActions } from './hooks'
import { BulkActionsModal, SaveSegmentModal } from './components'
import { useState } from 'react'
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

export default function ContactsPage() {
  const {
    contacts,
    tags,
    segments,
    sources,
    loading,
    pagination,
    search,
    setSearch,
    status,
    source,
    selectedTag,
    updateFilter,
    handleSearch,
    hasActiveFilters,
    getFilters,
    loadSegment,
    setPage,
    setLimit,
    fetchContacts,
    fetchTags,
  } = useContactsData()

  const bulk = useBulkActions({
    onSuccess: fetchContacts,
    fetchTags,
  })

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saveSegmentOpen, setSaveSegmentOpen] = useState(false)

  // Clear selection when filters change
  useEffect(() => {
    bulk.clearSelection()
  }, [search, status, source, selectedTag, pagination.page, pagination.limit])

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

  const handleExport = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      format,
      status,
      tagId: selectedTag,
    })
    window.location.href = `/api/admin/contacts/export?${params}`
  }

  return (
    <div>
      {/* Header */}
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

      {/* Filter Bar */}
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
            onChange: (value) => updateFilter('status', value),
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
            onChange: (value) => updateFilter('source', value),
            options: [
              { value: 'all', label: 'All Sources' },
              ...sources.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            name: 'tag',
            label: 'Tag',
            value: selectedTag,
            onChange: (value) => updateFilter('selectedTag', value),
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
      {bulk.selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-neu flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-700">
              {bulk.selectAllMatching
                ? `All ${pagination.total} matching contacts selected`
                : `${bulk.selectedIds.size} contact${bulk.selectedIds.size !== 1 ? 's' : ''} selected`}
            </span>
            {bulk.selectedIds.size === contacts.length &&
              pagination.total > contacts.length &&
              !bulk.selectAllMatching && (
                <button
                  onClick={() => bulk.setSelectAllMatching(true)}
                  className="text-sm text-primary-600 underline hover:text-primary-700"
                >
                  Select all {pagination.total} matching contacts
                </button>
              )}
            {bulk.selectAllMatching && (
              <button
                onClick={() => bulk.setSelectAllMatching(false)}
                className="text-sm text-primary-600 underline hover:text-primary-700"
              >
                Select only this page
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => bulk.openBulkModal('addTags')} className="text-sm">
              <Tags className="w-4 h-4 mr-1" />
              Add Tags
            </Button>
            <Button variant="secondary" onClick={() => bulk.openBulkModal('removeTags')} className="text-sm">
              <X className="w-4 h-4 mr-1" />
              Remove Tags
            </Button>
            <Button variant="secondary" onClick={() => bulk.openBulkModal('changeStatus')} className="text-sm">
              <Archive className="w-4 h-4 mr-1" />
              Change Status
            </Button>
            <Button variant="danger" onClick={() => bulk.openBulkModal('delete')} className="text-sm">
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
                  onClick={() => bulk.toggleSelectAll(contacts.map((c) => c.id))}
                  className="text-text-muted hover:text-text-primary"
                >
                  {bulk.selectedIds.size === 0 ? (
                    <Square className="w-5 h-5" />
                  ) : bulk.selectedIds.size === contacts.length ? (
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
                      onClick={() => bulk.toggleSelect(contact.id)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      {bulk.selectedIds.has(contact.id) ? (
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
                onChange={(e) => setLimit(Number(e.target.value))}
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
              onPageChange={setPage}
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
      <BulkActionsModal
        isOpen={bulk.bulkModalOpen}
        action={bulk.bulkAction}
        loading={bulk.bulkLoading}
        onClose={bulk.closeBulkModal}
        onExecute={() => bulk.executeBulkAction({
          search,
          status,
          source,
          tagId: selectedTag,
        })}
        tags={tags}
        selectedTagIds={bulk.bulkTags}
        onToggleTag={bulk.toggleBulkTag}
        newTags={bulk.bulkNewTags}
        newTagInput={bulk.bulkNewTagInput}
        newTagColor={bulk.bulkNewTagColor}
        onNewTagInputChange={bulk.setBulkNewTagInput}
        onNewTagColorChange={bulk.setBulkNewTagColor}
        onAddNewTag={() => bulk.addNewTag(tags)}
        onRemoveNewTag={bulk.removeNewTag}
        status={bulk.bulkStatus}
        onStatusChange={bulk.setBulkStatus}
        selectedCount={bulk.selectedIds.size}
      />

      {/* Save Segment Modal */}
      <SaveSegmentModal
        isOpen={saveSegmentOpen}
        onClose={() => setSaveSegmentOpen(false)}
        onSuccess={() => {
          setSaveSegmentOpen(false)
          // Refresh segments - but we need fetchSegments from useContactsData
        }}
        status={status}
        source={source}
        selectedTag={selectedTag}
        search={search}
        tags={tags}
      />
    </div>
  )
}

// CreateContactModal component
function CreateContactModal({
  tags,
  onClose,
  onSuccess,
}: {
  tags: { id: string; name: string; color: string }[]
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
