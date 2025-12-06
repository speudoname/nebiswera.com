'use client'

import { useState } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import type { Tag } from '../hooks'

interface SaveSegmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  // Current filter state
  status: string
  source: string
  selectedTag: string
  search: string
  tags: Tag[]
}

export function SaveSegmentModal({
  isOpen,
  onClose,
  onSuccess,
  status,
  source,
  selectedTag,
  search,
  tags,
}: SaveSegmentModalProps) {
  const [segmentName, setSegmentName] = useState('')
  const [segmentDescription, setSegmentDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    setSegmentName('')
    setSegmentDescription('')
    onClose()
  }

  const handleSave = async () => {
    if (!segmentName.trim()) return

    setSaving(true)
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
        handleClose()
        onSuccess()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save segment')
      }
    } catch (error) {
      console.error('Failed to save segment:', error)
      alert('Failed to save segment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save as Segment">
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
        <Button type="button" variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          loading={saving}
          disabled={!segmentName.trim()}
        >
          Save Segment
        </Button>
      </div>
    </Modal>
  )
}
