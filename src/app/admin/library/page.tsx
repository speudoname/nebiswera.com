'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Trash2, Copy, Check, Loader2, Image, Video, RefreshCw, ExternalLink, FolderOpen, Film, ImageIcon } from 'lucide-react'
import { Button, Card } from '@/components/ui'

type ContentType = 'all' | 'images' | 'videos'

interface ContentItem {
  key: string
  url: string
  size: number
  lastModified: string
  name: string
  source: string
}

export default function LibraryPage() {
  const [images, setImages] = useState<ContentItem[]>([])
  const [videos, setVideos] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [contentType, setContentType] = useState<ContentType>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadContent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content-library')
      if (!res.ok) throw new Error('Failed to load content')
      const data = await res.json()
      setImages(data.images || [])
      setVideos(data.videos || [])
    } catch (error) {
      console.error('Failed to load library:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/admin/email-images/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Upload failed')
        }
      }

      // Refresh the list
      await loadContent()
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    setDeleting(key)
    try {
      const res = await fetch(`/api/admin/email-images/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Delete failed')
      }

      // Refresh content
      await loadContent()
      setSelectedItems(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} file(s)?`)) return

    setDeleting('bulk')
    try {
      const keysToDelete = Array.from(selectedItems)
      for (const key of keysToDelete) {
        const res = await fetch(`/api/admin/email-images/${encodeURIComponent(key)}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          console.error(`Failed to delete ${key}`)
        }
      }

      // Refresh the list
      await loadContent()
      setSelectedItems(new Set())
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const toggleSelect = (key: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter content based on type and source
  const filteredContent = (() => {
    let items: ContentItem[] = []

    if (contentType === 'all') {
      items = [...images, ...videos].sort((a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      )
    } else if (contentType === 'images') {
      items = images
    } else {
      items = videos
    }

    if (sourceFilter !== 'all') {
      items = items.filter(item => item.source === sourceFilter)
    }

    return items
  })()

  // Get unique sources for filter dropdown
  const allSources = Array.from(new Set([...images.map(i => i.source), ...videos.map(v => v.source)]))

  const totalSize = filteredContent.reduce((sum, item) => sum + item.size, 0)

  const selectAll = () => {
    if (selectedItems.size === filteredContent.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredContent.map(item => item.key)))
    }
  }

  // Check if item is a video
  const isVideo = (item: ContentItem) => {
    const ext = item.name.split('.').pop()?.toLowerCase() || ''
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <FolderOpen className="w-8 h-8" />
            Content Library
          </h1>
          <p className="text-text-muted mt-1">
            {filteredContent.length} items ({formatSize(totalSize)} total)
            {images.length > 0 && videos.length > 0 && (
              <span className="ml-2">
                ({images.length} images, {videos.length} videos)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            onClick={loadContent}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card variant="raised" padding="sm">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setContentType('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                contentType === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setContentType('images')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                contentType === 'images'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images ({images.length})
            </button>
            <button
              onClick={() => setContentType('videos')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                contentType === 'videos'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Film className="w-4 h-4" />
              Videos ({videos.length})
            </button>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="all">All Sources</option>
              {allSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card variant="raised" padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear Selection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting === 'bulk'}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleting === 'bulk' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Content Grid */}
      {loading && filteredContent.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredContent.length === 0 ? (
        <Card variant="raised" padding="lg">
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No content yet</h3>
            <p className="text-text-muted mb-4">Upload your first file to get started</p>
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Content
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedItems.size === filteredContent.length && filteredContent.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-text-muted">Select All</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredContent.map((item) => (
              <Card
                key={item.key}
                variant="raised"
                padding="none"
                className={`group overflow-hidden ${
                  selectedItems.has(item.key) ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.key)}
                    onChange={() => toggleSelect(item.key)}
                    className="w-4 h-4 rounded border-gray-300 bg-white/80"
                  />
                </div>

                {/* Source Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded">
                    {item.source}
                  </span>
                </div>

                {/* Preview */}
                <div className="relative aspect-square bg-gray-100">
                  {isVideo(item) ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Video className="w-12 h-12 text-gray-400" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded">
                        VIDEO
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === item.url ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-700" />
                      )}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-700" />
                    </a>
                    <button
                      onClick={() => handleDelete(item.key)}
                      disabled={deleting === item.key}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      {deleting === item.key ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Item Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-text-primary truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-text-muted">{formatSize(item.size)}</span>
                    {item.lastModified && (
                      <span className="text-xs text-text-muted">{formatDate(item.lastModified)}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
