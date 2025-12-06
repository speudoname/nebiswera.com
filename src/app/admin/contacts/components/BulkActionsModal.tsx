'use client'

import { Button, Modal } from '@/components/ui'
import { AlertTriangle, Plus, X } from 'lucide-react'
import type { BulkAction, ContactStatus } from '../hooks'
import type { Tag } from '../hooks'

interface BulkActionsModalProps {
  isOpen: boolean
  action: BulkAction | null
  loading: boolean
  onClose: () => void
  onExecute: () => void
  // Tags
  tags: Tag[]
  selectedTagIds: string[]
  onToggleTag: (tagId: string) => void
  // New tags (for addTags action)
  newTags: { name: string; color: string }[]
  newTagInput: string
  newTagColor: string
  onNewTagInputChange: (value: string) => void
  onNewTagColorChange: (value: string) => void
  onAddNewTag: () => void
  onRemoveNewTag: (name: string) => void
  // Status (for changeStatus action)
  status: ContactStatus
  onStatusChange: (status: ContactStatus) => void
  // Selection info
  selectedCount: number
}

export function BulkActionsModal({
  isOpen,
  action,
  loading,
  onClose,
  onExecute,
  tags,
  selectedTagIds,
  onToggleTag,
  newTags,
  newTagInput,
  newTagColor,
  onNewTagInputChange,
  onNewTagColorChange,
  onAddNewTag,
  onRemoveNewTag,
  status,
  onStatusChange,
  selectedCount,
}: BulkActionsModalProps) {
  const title =
    action === 'addTags'
      ? 'Add Tags'
      : action === 'removeTags'
      ? 'Remove Tags'
      : action === 'changeStatus'
      ? 'Change Status'
      : 'Delete Contacts'

  const canExecute =
    action === 'delete' ||
    action === 'changeStatus' ||
    (action === 'addTags' && (selectedTagIds.length > 0 || newTags.length > 0)) ||
    (action === 'removeTags' && selectedTagIds.length > 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {(action === 'addTags' || action === 'removeTags') && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            {action === 'addTags' ? 'Select tags to add:' : 'Select tags to remove:'}
          </p>

          {/* Existing tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedTagIds.includes(tag.id)
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
          {action === 'addTags' && (
            <>
              {/* New tags to be created */}
              {newTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newTags.map((tag) => (
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
                        onClick={() => onRemoveNewTag(tag.name)}
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
                    value={newTagColor}
                    onChange={(e) => onNewTagColorChange(e.target.value)}
                    className="w-9 h-9 rounded-neu border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => onNewTagInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagInput.trim()) {
                        e.preventDefault()
                        onAddNewTag()
                      }
                    }}
                    placeholder="New tag name..."
                    className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                  />
                  <Button type="button" variant="secondary" onClick={onAddNewTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {action === 'changeStatus' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Select new status:</p>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ContactStatus)}
            className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="BOUNCED">Bounced</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      )}

      {action === 'delete' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-text-secondary text-center">
            Are you sure you want to delete {selectedCount} contact
            {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={action === 'delete' ? 'danger' : 'primary'}
          onClick={onExecute}
          loading={loading}
          disabled={!canExecute}
        >
          {action === 'delete'
            ? 'Delete'
            : action === 'addTags'
            ? 'Add Tags'
            : action === 'removeTags'
            ? 'Remove Tags'
            : 'Update Status'}
        </Button>
      </div>
    </Modal>
  )
}
