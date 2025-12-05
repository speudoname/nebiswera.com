'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Image, Check, Loader2, Copy, X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui'

interface BlogImage {
  path: string
  url: string
  name: string
  size: number
  lastModified: string
}

interface BlogImageManagerProps {
  onImageSelect?: (url: string) => void
}

export function BlogImageManager({ onImageSelect }: BlogImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [images, setImages] = useState<BlogImage[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setLastUploadedUrl(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/blog-images/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await res.json()
      setLastUploadedUrl(data.url)

      // Auto-copy the URL
      await copyToClipboard(data.url)

      // Call callback if provided
      onImageSelect?.(data.url)

      // Refresh library if open
      if (showLibrary) {
        loadLibrary()
      }
    } catch (error: unknown) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const loadLibrary = async () => {
    setLoadingLibrary(true)
    try {
      const res = await fetch('/api/admin/blog-images')
      if (!res.ok) throw new Error('Failed to load images')
      const data = await res.json()
      setImages(data.images || [])
    } catch (error) {
      console.error('Failed to load library:', error)
    } finally {
      setLoadingLibrary(false)
    }
  }

  const toggleLibrary = () => {
    if (!showLibrary) {
      loadLibrary()
    }
    setShowLibrary(!showLibrary)
  }

  const handleSelectImage = (url: string) => {
    copyToClipboard(url)
    onImageSelect?.(url)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      {/* Upload and Library Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>

        <Button
          variant={showLibrary ? 'primary' : 'ghost'}
          size="sm"
          onClick={toggleLibrary}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          {showLibrary ? 'Hide Library' : 'Image Library'}
        </Button>

        {/* Show last uploaded URL */}
        {lastUploadedUrl && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
            <Check className="w-4 h-4" />
            <span className="font-medium">Copied!</span>
            <button
              onClick={() => copyToClipboard(lastUploadedUrl)}
              className="ml-1 hover:text-green-600"
              title="Copy again"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Image Library */}
      {showLibrary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Blog Image Library</h4>
            <button
              onClick={() => setShowLibrary(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loadingLibrary ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
              {images.map((img) => (
                <div
                  key={img.path}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary-500 transition-all"
                  onClick={() => handleSelectImage(img.url)}
                  title={`Click to copy URL\n${img.name}\n${formatSize(img.size)}`}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {copiedUrl === img.url ? (
                      <div className="flex items-center gap-1 text-white text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Copied!
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-white text-sm font-medium">
                        <Copy className="w-4 h-4" />
                        Copy URL
                      </div>
                    )}
                  </div>

                  {/* Size badge */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatSize(img.size)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-3">
            Click any image to copy its URL. Paste into the image URL field in the editor.
          </p>
        </div>
      )}
    </div>
  )
}
