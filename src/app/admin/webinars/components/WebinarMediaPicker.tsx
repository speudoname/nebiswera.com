'use client'

import { useState, useRef } from 'react'
import { Input, Button } from '@/components/ui'
import { Upload, Link as LinkIcon, Image as ImageIcon, Video, X, Loader2, FolderOpen } from 'lucide-react'

interface MediaItem {
  Guid: string
  ObjectName: string
  Path: string
  url: string
}

interface WebinarMediaPickerProps {
  label: string
  value: string | null
  onChange: (url: string) => void
  mediaType?: 'images' | 'videos' | 'both'
  accept?: string
  placeholder?: string
}

export function WebinarMediaPicker({
  label,
  value,
  onChange,
  mediaType = 'images',
  accept,
  placeholder = 'https://...',
}: WebinarMediaPickerProps) {
  const [mode, setMode] = useState<'url' | 'upload' | 'library'>('url')
  const [uploading, setUploading] = useState(false)
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [library, setLibrary] = useState<MediaItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isVideo = mediaType === 'videos'
  const acceptTypes = accept || (isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadProgress('Uploading...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', isVideo ? 'videos' : 'images')

      const res = await fetch('/api/admin/webinar-media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      onChange(data.url)
      setMode('url')
      setUploadProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const loadLibrary = async () => {
    setLoadingLibrary(true)
    setError(null)

    try {
      const type = isVideo ? 'videos' : 'images'
      const res = await fetch(`/api/admin/webinar-media?type=${type}`)

      if (!res.ok) {
        throw new Error('Failed to load media library')
      }

      const data = await res.json()
      setLibrary(data.media || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
    } finally {
      setLoadingLibrary(false)
    }
  }

  const handleOpenLibrary = () => {
    setMode('library')
    loadLibrary()
  }

  const handleSelectFromLibrary = (url: string) => {
    onChange(url)
    setMode('url')
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">{label}</label>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-neu transition-colors ${
            mode === 'url'
              ? 'bg-primary-500 text-white'
              : 'bg-neu-base text-text-muted hover:bg-neu-dark'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-neu transition-colors ${
            mode === 'upload'
              ? 'bg-primary-500 text-white'
              : 'bg-neu-base text-text-muted hover:bg-neu-dark'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
        <button
          type="button"
          onClick={handleOpenLibrary}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-neu transition-colors ${
            mode === 'library'
              ? 'bg-primary-500 text-white'
              : 'bg-neu-base text-text-muted hover:bg-neu-dark'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Library
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {value && (
            <div className="relative">
              {isVideo ? (
                <video
                  src={value}
                  className="w-full max-h-48 object-contain rounded-neu bg-gray-100"
                  controls
                />
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full max-h-48 object-contain rounded-neu bg-gray-100"
                />
              )}
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleFileUpload}
            className="hidden"
            id={`upload-${label.replace(/\s+/g, '-')}`}
          />
          <label
            htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-neu cursor-pointer transition-colors ${
              uploading
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 bg-neu-base hover:bg-neu-light'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                <span className="text-sm text-primary-600">{uploadProgress}</span>
              </>
            ) : (
              <>
                {isVideo ? (
                  <Video className="w-8 h-8 text-gray-400 mb-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                )}
                <span className="text-sm text-text-muted">
                  Click to upload {isVideo ? 'video' : 'image'}
                </span>
                <span className="text-xs text-text-muted mt-1">
                  {isVideo ? 'MP4, WebM, MOV (max 500MB)' : 'JPG, PNG, WebP, GIF (max 10MB)'}
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {/* Library Mode */}
      {mode === 'library' && (
        <div className="space-y-3">
          {loadingLibrary ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : library.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No {isVideo ? 'videos' : 'images'} in library yet.</p>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className="text-primary-600 hover:underline mt-2"
              >
                Upload your first {isVideo ? 'video' : 'image'}
              </button>
            </div>
          ) : (
            <div className={`grid gap-3 ${isVideo ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-4'}`}>
              {library.map((item) => (
                <button
                  key={item.Guid}
                  type="button"
                  onClick={() => handleSelectFromLibrary(item.url)}
                  className={`relative aspect-video rounded-neu overflow-hidden border-2 transition-all hover:border-primary-500 ${
                    value === item.url ? 'border-primary-500 ring-2 ring-primary-300' : 'border-transparent'
                  }`}
                >
                  {isVideo ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded truncate max-w-[90%]">
                        {item.ObjectName.split('/').pop()}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.ObjectName}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {value === item.url && (
                    <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                      <div className="bg-primary-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={loadLibrary}
              disabled={loadingLibrary}
            >
              {loadingLibrary ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
