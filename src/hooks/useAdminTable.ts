'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Shared hook for admin table components
 * Handles pagination, search, filtering, and CRUD operations
 */

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseAdminTableOptions<TFilter extends string = string> {
  /** API endpoint to fetch data from */
  endpoint: string
  /** Default items per page */
  defaultLimit?: number
  /** Key in the API response containing the data array */
  dataKey?: string
  /** Initial status filter value */
  initialFilter?: TFilter | 'all'
  /** Filter parameter name in API query */
  filterParam?: string
}

export interface UseAdminTableReturn<TItem, TFilter extends string = string> {
  // Data state
  items: TItem[]
  loading: boolean
  pagination: PaginationState

  // Search & filter state
  search: string
  setSearch: (value: string) => void
  filter: TFilter | 'all'
  setFilter: (value: TFilter | 'all') => void

  // Actions
  refresh: () => Promise<void>
  handleSearch: (e: React.FormEvent) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void

  // Delete modal state
  deleteConfirm: string | null
  setDeleteConfirm: (id: string | null) => void
  deletingId: string | null
  handleDelete: (id: string, onSuccess?: () => void) => Promise<void>

  // Optimistic update helpers
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<TItem>) => void
}

export function useAdminTable<TItem extends { id: string }, TFilter extends string = string>(
  options: UseAdminTableOptions<TFilter>
): UseAdminTableReturn<TItem, TFilter> {
  const {
    endpoint,
    defaultLimit = 20,
    dataKey,
    initialFilter = 'all' as TFilter | 'all',
    filterParam = 'status',
  } = options

  // Infer data key from endpoint if not provided (e.g., /api/admin/webinars -> webinars)
  const inferredDataKey = dataKey || endpoint.split('/').pop() || 'items'

  // Data state
  const [items, setItems] = useState<TItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: defaultLimit,
    total: 0,
    totalPages: 0,
  })

  // Search & filter state
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TFilter | 'all'>(initialFilter)

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (filter !== 'all') params.set(filterParam, filter)
      if (search) params.set('search', search)

      const res = await fetch(`${endpoint}?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data[inferredDataKey] || data.data || [])
        setPagination(data.pagination || {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch ${inferredDataKey}:`, error)
    } finally {
      setLoading(false)
    }
  }, [endpoint, pagination.page, pagination.limit, filter, filterParam, search, inferredDataKey])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle search form submit
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  // Handle filter change (reset to page 1)
  const handleFilterChange = useCallback((value: TFilter | 'all') => {
    setFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  // Set page
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  // Set limit (reset to page 1)
  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  // Handle delete
  const handleDelete = useCallback(async (id: string, onSuccess?: () => void) => {
    setDeletingId(id)
    try {
      // Extract base endpoint for delete (remove query params if any)
      const baseEndpoint = endpoint.split('?')[0]
      const res = await fetch(`${baseEndpoint}/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        // Optimistic update
        setItems((prev) => prev.filter((item) => item.id !== id))
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
        // Callback
        onSuccess?.()
        // Refresh from server
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }, [endpoint, fetchData])

  // Optimistic update: remove item
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
  }, [])

  // Optimistic update: update item
  const updateItem = useCallback((id: string, updates: Partial<TItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  return {
    // Data state
    items,
    loading,
    pagination,

    // Search & filter state
    search,
    setSearch,
    filter,
    setFilter: handleFilterChange,

    // Actions
    refresh: fetchData,
    handleSearch,
    setPage,
    setLimit,

    // Delete modal state
    deleteConfirm,
    setDeleteConfirm,
    deletingId,
    handleDelete,

    // Optimistic update helpers
    removeItem,
    updateItem,
  }
}

/**
 * Helper to create status badge classes
 */
export function getStatusBadgeClass(
  status: string,
  statusColors: Record<string, string>
): string {
  return statusColors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Common status color mappings
 */
export const STATUS_COLORS = {
  // Generic
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',

  // Campaign specific
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-yellow-100 text-yellow-700 animate-pulse',
  PAUSED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
} as const

/**
 * Format date for display in tables
 */
export function formatTableDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate percentage rate
 */
export function calculateRate(numerator: number, denominator: number): string {
  if (denominator === 0) return '-'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}
