'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Trash2, Copy, Check, Loader2, Image, RefreshCw, ExternalLink } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface EmailImage {
  key: string
  url: string
  size: number
  lastModified?: string
  name: string
}

export default function LibraryPage() {
  const [images, setImages] = useState<EmailImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-images')
      if (!res.ok) throw new Error('Failed to load images')
      const data = await res.json()
      setImages(data.images || [])
    } catch (error) {
      console.error('Failed to load library:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadImages()
  }, [loadImages])

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
      await loadImages()
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
    if (!confirm('Are you sure you want to delete this image?')) return

    setDeleting(key)
    try {
      const res = await fetch(`/api/admin/email-images/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Delete failed')
      }

      // Remove from local state
      setImages(images.filter(img => img.key !== key))
      setSelectedImages(prev => {
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
    if (selectedImages.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) return

    setDeleting('bulk')
    try {
      const keysToDelete = Array.from(selectedImages)
      for (const key of keysToDelete) {
        const res = await fetch(`/api/admin/email-images/${encodeURIComponent(key)}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          console.error(`Failed to delete ${key}`)
        }
      }

      // Refresh the list
      await loadImages()
      setSelectedImages(new Set())
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const toggleSelect = (key: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(images.map(img => img.key)))
    }
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

  const totalSize = images.reduce((sum, img) => sum + img.size, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Image Library</h1>
          <p className="text-text-muted mt-1">
            {images.length} images ({formatSize(totalSize)} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            onClick={loadImages}
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
                Upload Images
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedImages.size > 0 && (
        <Card variant="raised" padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {selectedImages.size} image(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedImages(new Set())}>
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

      {/* Image Grid */}
      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : images.length === 0 ? (
        <Card variant="raised" padding="lg">
          <div className="text-center py-12">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No images yet</h3>
            <p className="text-text-muted mb-4">Upload your first image to get started</p>
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedImages.size === images.length && images.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-text-muted">Select All</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img) => (
              <Card
                key={img.key}
                variant="raised"
                padding="none"
                className={`group overflow-hidden ${
                  selectedImages.has(img.key) ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(img.key)}
                    onChange={() => toggleSelect(img.key)}
                    className="w-4 h-4 rounded border-gray-300 bg-white/80"
                  />
                </div>

                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyToClipboard(img.url)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === img.url ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-700" />
                      )}
                    </button>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-700" />
                    </a>
                    <button
                      onClick={() => handleDelete(img.key)}
                      disabled={deleting === img.key}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      {deleting === img.key ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-text-primary truncate" title={img.name}>
                    {img.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-text-muted">{formatSize(img.size)}</span>
                    {img.lastModified && (
                      <span className="text-xs text-text-muted">{formatDate(img.lastModified)}</span>
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
