'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface Filters {
  search: string
  status: string
  source: string
  selectedTag: string
}

export function useContactsData() {
  // Data state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')
  const [selectedTag, setSelectedTag] = useState('')

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts/tags')
      const data = await res.json()
      setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }, [])

  // Fetch segments
  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts/segments')
      const data = await res.json()
      setSegments(data)
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    }
  }, [])

  // Fetch contacts
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

  // Initial data load
  useEffect(() => {
    fetchTags()
    fetchSegments()
  }, [fetchTags, fetchSegments])

  // Refetch contacts when filters change
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Update filter with page reset
  const updateFilter = useCallback((
    filterName: 'status' | 'source' | 'selectedTag',
    value: string
  ) => {
    if (filterName === 'status') setStatus(value)
    else if (filterName === 'source') setSource(value)
    else if (filterName === 'selectedTag') setSelectedTag(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // Handle search form submit
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchContacts()
  }, [fetchContacts])

  // Load segment filters
  const loadSegment = useCallback((segment: Segment) => {
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
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // Change page
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  // Change limit
  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  // Check if any filters are active
  const hasActiveFilters = status !== 'all' || source !== 'all' || selectedTag || search

  // Get current filters for bulk operations
  const getFilters = useCallback((): Filters => ({
    search,
    status,
    source,
    selectedTag,
  }), [search, status, source, selectedTag])

  return {
    // Data
    contacts,
    tags,
    segments,
    sources,
    loading,
    pagination,

    // Filters
    search,
    setSearch,
    status,
    source,
    selectedTag,
    updateFilter,
    handleSearch,
    hasActiveFilters,
    getFilters,

    // Segment
    loadSegment,

    // Pagination
    setPage,
    setLimit,

    // Refresh functions
    fetchContacts,
    fetchTags,
    fetchSegments,
  }
}

// Re-export types for use in components
export type { Tag, Segment, Contact, PaginationState }
