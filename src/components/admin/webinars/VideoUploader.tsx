'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui'
import { X, Loader2, CheckCircle, AlertCircle, Video } from 'lucide-react'

interface VideoUploaderProps {
  webinarId?: string
  webinarTitle?: string
  onUploadComplete: (videoData: {
    bunnyVideoId: string
    duration: number
    thumbnail: string
    hlsUrl: string
  }) => void
  onError?: (error: string) => void
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export function VideoUploader({
  webinarId,
  webinarTitle,
  onUploadComplete,
  onError,
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [bunnyStatus, setBunnyStatus] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Poll for video processing status
  const pollVideoStatus = useCallback(async (wId: string) => {
    setStatus('processing')
    setProgress(0)

    const maxAttempts = 360 // 30 minutes max (5s intervals)
    let attempts = 0
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Video processing timed out.')
        setStatus('error')
        onError?.('Video processing timed out')
        return
      }

      try {
        const res = await fetch(`/api/admin/webinars/upload?webinarId=${wId}`)
        const data = await res.json()

        consecutiveErrors = 0

        if (data.error === 'No video processing job found') {
          attempts++
          pollingRef.current = setTimeout(poll, 5000)
          return
        }

        setProgress(data.progress || 0)
        if (data.bunnyStatus) {
          setBunnyStatus(data.bunnyStatus)
        }

        if (data.status === 'COMPLETED') {
          setStatus('complete')
          onUploadComplete({
            bunnyVideoId: wId,
            duration: data.duration || 0,
            thumbnail: data.thumbnailUrl || '',
            hlsUrl: data.hlsUrl || '',
          })
          return
        }

        if (data.status === 'FAILED') {
          setError(data.error || 'Video processing failed')
          setStatus('error')
          onError?.(data.error || 'Video processing failed')
          return
        }

        attempts++
        pollingRef.current = setTimeout(poll, 5000)
      } catch (err) {
        console.error('Error polling video status:', err)
        consecutiveErrors++

        if (consecutiveErrors >= maxConsecutiveErrors) {
          setError(err instanceof Error ? err.message : 'Error checking processing status')
          setStatus('error')
          onError?.(err instanceof Error ? err.message : 'Error checking processing status')
          return
        }

        attempts++
        pollingRef.current = setTimeout(poll, 5000)
      }
    }

    pollingRef.current = setTimeout(poll, 3000)
  }, [onUploadComplete, onError])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    // Validate file size (max 500MB for direct upload)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 500MB')
      return
    }

    if (!webinarId) {
      setError('Please save the webinar first before uploading video')
      return
    }

    setFileName(file.name)
    setError(null)
    setStatus('uploading')
    setProgress(0)

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Create FormData with video file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('webinarId', webinarId)
      if (webinarTitle) {
        formData.append('title', webinarTitle)
      }

      // Upload directly to our API (which sends to Bunny)
      const response = await fetch('/api/admin/webinars/upload', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to upload video')
      }

      const data = await response.json()

      // Start polling for processing status
      pollVideoStatus(webinarId)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle')
        setProgress(0)
        return
      }

      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload video')
      setStatus('error')
      onError?.(err instanceof Error ? err.message : 'Failed to upload video')
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
    }
    setStatus('idle')
    setProgress(0)
    setFileName(null)
    setError(null)
    setBunnyStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRetry = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
    }
    setStatus('idle')
    setProgress(0)
    setError(null)
    setBunnyStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getProcessingStatusText = () => {
    if (bunnyStatus) {
      return `${bunnyStatus}${progress > 0 ? `: ${progress}%` : ''}`
    }
    return progress > 0 ? `Transcoding: ${progress}%` : 'Processing video...'
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {status === 'idle' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neu-dark rounded-neu p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
        >
          <Video className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Upload Webinar Video
          </h4>
          <p className="text-text-muted mb-4">
            Click to select a video file (max 500MB)
          </p>
          <p className="text-sm text-text-muted">
            Supported formats: MP4, MOV, WebM
          </p>
          {!webinarId && (
            <p className="text-sm text-amber-600 mt-4">
              Save the webinar first before uploading video
            </p>
          )}
        </div>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="border border-neu-dark rounded-neu p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="font-medium text-text-primary">
                {status === 'uploading' && `Uploading: ${fileName}`}
                {status === 'processing' && getProcessingStatusText()}
              </span>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 text-text-muted hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neu-dark rounded-full h-3 mb-2">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-text-muted text-right">
            {status === 'uploading' && 'Uploading to Bunny Stream...'}
            {status === 'processing' && (
              progress > 0 ? `${progress}% transcoded` : 'Transcoding to adaptive bitrate...'
            )}
          </p>

          {status === 'processing' && (
            <p className="text-xs text-text-muted mt-2">
              Video is being transcoded to multiple quality levels by Bunny Stream.
              This may take a few minutes depending on video length.
            </p>
          )}
        </div>
      )}

      {status === 'complete' && (
        <div className="border border-green-200 bg-green-50 rounded-neu p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Video Ready!</h4>
              <p className="text-sm text-green-600">
                {fileName} - Transcoded with adaptive bitrate streaming
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="border border-red-200 bg-red-50 rounded-neu p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">Upload Failed</h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {error && status === 'idle' && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  )
}
