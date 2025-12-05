'use client'

import { useState, useRef } from 'react'
import { Input, Button } from '@/components/ui'
import { Upload, Link as LinkIcon, Image as ImageIcon, Video, X, Loader2, FolderOpen, Sparkles, Check } from 'lucide-react'

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
  /** Optional content context for AI-aware image generation (e.g., blog title + excerpt) */
  contentContext?: string
  /** Optional hint text shown below the component */
  hint?: string
}

export function WebinarMediaPicker({
  label,
  value,
  onChange,
  mediaType = 'images',
  accept,
  placeholder = 'https://...',
  contentContext,
  hint,
}: WebinarMediaPickerProps) {
  const [mode, setMode] = useState<'url' | 'upload' | 'library' | 'generate'>('url')
  const [uploading, setUploading] = useState(false)
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [library, setLibrary] = useState<MediaItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Generation state
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generateStyle, setGenerateStyle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)

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

  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedPreview(null)

    try {
      const response = await fetch('/api/admin/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatePrompt,
          style: generateStyle || 'professional, high quality',
          aspectRatio: '16:9',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      // Show preview (image is already saved to library by API)
      setGeneratedPreview(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseGeneratedImage = () => {
    if (generatedPreview) {
      onChange(generatedPreview)
      setGeneratedPreview(null)
      setGeneratePrompt('')
      setGenerateStyle('')
      setMode('url')
    }
  }

  const handleDiscardGenerated = () => {
    setGeneratedPreview(null)
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
        {!isVideo && (
          <button
            type="button"
            onClick={() => setMode('generate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-neu transition-colors ${
              mode === 'generate'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-neu-base text-text-muted hover:bg-neu-dark'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate
          </button>
        )}
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

      {/* Generate Mode */}
      {mode === 'generate' && (
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">AI Image Generation</span>
            </div>
            <p className="text-xs text-purple-600">
              Generate custom images using AI. Images are automatically saved to your library.
            </p>
          </div>

          {!generatedPreview ? (
            <>
              {/* Generate from content button - only shown when contentContext is provided */}
              {contentContext && (
                <Button
                  type="button"
                  onClick={() => {
                    // Extract a good prompt from the content
                    const truncatedContext = contentContext.substring(0, 500)
                    setGeneratePrompt(`Professional featured image for a blog post about: ${truncatedContext}`)
                    setGenerateStyle('professional, modern, high quality, blog header')
                  }}
                  variant="secondary"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Auto-fill from content
                </Button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the image you want
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g., Professional banner image for a webinar about personal development..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style (optional)
                </label>
                <input
                  type="text"
                  value={generateStyle}
                  onChange={(e) => setGenerateStyle(e.target.value)}
                  placeholder="e.g., photorealistic, minimalist, watercolor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <Button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGenerating || !generatePrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating (this may take a minute)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border-2 border-purple-300">
                <img
                  src={generatedPreview}
                  alt="Generated preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Generated
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This image has been saved to your library. Use it or generate a new one.
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUseGeneratedImage}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use This Image
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDiscardGenerated}
                >
                  <X className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hint text */}
      {hint && (
        <p className="text-xs text-gray-500 mt-2">{hint}</p>
      )}
    </div>
  )
}
