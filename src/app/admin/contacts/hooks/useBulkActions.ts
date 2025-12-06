'use client'

import { useState, useCallback } from 'react'

export type BulkAction = 'addTags' | 'removeTags' | 'changeStatus' | 'delete'

export type ContactStatus = 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'

interface NewTag {
  name: string
  color: string
}

interface BulkFilters {
  search: string
  status: string
  source: string
  tagId: string
}

interface UseBulkActionsOptions {
  onSuccess: () => void
  fetchTags: () => void
}

export function useBulkActions({ onSuccess, fetchTags }: UseBulkActionsOptions) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAllMatching, setSelectAllMatching] = useState(false)

  // Modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Bulk action form state
  const [bulkTags, setBulkTags] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<ContactStatus>('ACTIVE')
  const [bulkNewTags, setBulkNewTags] = useState<NewTag[]>([])
  const [bulkNewTagInput, setBulkNewTagInput] = useState('')
  const [bulkNewTagColor, setBulkNewTagColor] = useState('#8B5CF6')

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectAllMatching(false)
  }, [])

  // Toggle all visible contacts
  const toggleSelectAll = useCallback((visibleContactIds: string[]) => {
    if (selectedIds.size === visibleContactIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleContactIds))
    }
  }, [selectedIds.size])

  // Toggle single contact
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Open bulk action modal
  const openBulkModal = useCallback((action: BulkAction) => {
    setBulkAction(action)
    setBulkModalOpen(true)
  }, [])

  // Close and reset modal
  const closeBulkModal = useCallback(() => {
    setBulkModalOpen(false)
    setBulkAction(null)
    setBulkTags([])
    setBulkNewTags([])
    setBulkNewTagInput('')
  }, [])

  // Add new tag to pending list
  const addNewTag = useCallback((existingTags: { id: string; name: string }[]) => {
    if (!bulkNewTagInput.trim()) return

    const exists = existingTags.some(
      t => t.name.toLowerCase() === bulkNewTagInput.trim().toLowerCase()
    )
    const existsInNew = bulkNewTags.some(
      t => t.name.toLowerCase() === bulkNewTagInput.trim().toLowerCase()
    )

    if (!exists && !existsInNew) {
      setBulkNewTags(prev => [...prev, { name: bulkNewTagInput.trim(), color: bulkNewTagColor }])
    }
    setBulkNewTagInput('')
  }, [bulkNewTagInput, bulkNewTagColor, bulkNewTags])

  // Remove pending new tag
  const removeNewTag = useCallback((name: string) => {
    setBulkNewTags(prev => prev.filter(t => t.name !== name))
  }, [])

  // Toggle existing tag selection
  const toggleBulkTag = useCallback((tagId: string) => {
    setBulkTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }, [])

  // Execute bulk action
  const executeBulkAction = useCallback(async (filters: BulkFilters) => {
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
          filters: selectAllMatching ? filters : undefined,
          action: bulkAction,
          tagIds: allTagIds,
          status: bulkStatus,
        }),
      })

      if (res.ok) {
        closeBulkModal()
        clearSelection()
        onSuccess()
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
  }, [
    bulkAction,
    selectedIds,
    selectAllMatching,
    bulkTags,
    bulkNewTags,
    bulkStatus,
    fetchTags,
    closeBulkModal,
    clearSelection,
    onSuccess,
  ])

  return {
    // Selection
    selectedIds,
    selectAllMatching,
    setSelectAllMatching,
    toggleSelectAll,
    toggleSelect,
    clearSelection,

    // Modal
    bulkModalOpen,
    bulkAction,
    bulkLoading,
    openBulkModal,
    closeBulkModal,

    // Form state
    bulkTags,
    bulkStatus,
    setBulkStatus,
    toggleBulkTag,

    // New tags
    bulkNewTags,
    bulkNewTagInput,
    setBulkNewTagInput,
    bulkNewTagColor,
    setBulkNewTagColor,
    addNewTag,
    removeNewTag,

    // Actions
    executeBulkAction,
  }
}
