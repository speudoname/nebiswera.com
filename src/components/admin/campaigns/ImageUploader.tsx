'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { Upload, X, Copy, Check, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  onUploadComplete?: (url: string) => void
}

export function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls: Array<{ url: string; name: string }> = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/email-images/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()
        uploadedUrls.push({ url: data.url, name: file.name })
      }

      setUploadedImages((prev) => [...uploadedUrls, ...prev])

      // If only one file, auto-copy URL
      if (uploadedUrls.length === 1) {
        handleCopyUrl(uploadedUrls[0].url)
        onUploadComplete?.(uploadedUrls[0].url)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleRemoveImage = (url: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.url !== url))
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-neu p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-700" />
          <h3 className="text-sm font-medium text-purple-900">Image Upload</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-purple-800 mb-3">
        Upload images to use in your email. Copy the URL and paste it into the image component in the editor.
        Max 5MB per image. Supports: JPEG, PNG, WebP, GIF
      </p>

      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-purple-900">Recently Uploaded:</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {uploadedImages.map((img) => (
              <div
                key={img.url}
                className="bg-white rounded border border-purple-200 p-2 flex items-center gap-2"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd"/%3E%3C/svg%3E'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{img.name}</p>
                  <p className="text-xs text-gray-500 truncate font-mono">{img.url}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyUrl(img.url)}
                  className="flex-shrink-0"
                >
                  {copiedUrl === img.url ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy URL
                    </>
                  )}
                </Button>
                <button
                  onClick={() => handleRemoveImage(img.url)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove from list"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
