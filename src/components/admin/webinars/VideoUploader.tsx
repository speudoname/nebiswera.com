'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui'
import { Upload, X, Loader2, CheckCircle, AlertCircle, Video } from 'lucide-react'

interface VideoUploaderProps {
  webinarId?: string
  webinarTitle?: string
  onUploadComplete: (videoData: {
    videoUid: string
    duration: number
    thumbnail: string
    hlsUrl?: string
  }) => void
  onError?: (error: string) => void
}

type UploadStatus = 'idle' | 'getting-url' | 'uploading' | 'processing' | 'complete' | 'error'

export function VideoUploader({
  webinarId,
  webinarTitle,
  onUploadComplete,
  onError,
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState<string>('PENDING')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for video processing status
  const pollVideoStatus = useCallback(async (wId: string) => {
    setStatus('processing')
    setProcessingProgress(0)
    setProcessingStatus('PENDING')

    const maxAttempts = 360 // 30 minutes max (5s intervals)
    let attempts = 0
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Video processing timed out. The worker may not be running.')
        setStatus('error')
        onError?.('Video processing timed out')
        return
      }

      try {
        const res = await fetch(`/api/admin/webinars/upload?webinarId=${wId}`)
        const data = await res.json()

        // Reset consecutive error count on successful response
        consecutiveErrors = 0

        // Job not found yet - keep polling
        if (data.error === 'No video processing job found') {
          attempts++
          pollingRef.current = setTimeout(poll, 5000)
          return
        }

        // Update status display
        setProcessingStatus(data.status)
        setProcessingProgress(data.progress || 0)

        // Only stop on COMPLETED or FAILED status
        if (data.status === 'COMPLETED') {
          setStatus('complete')
          onUploadComplete({
            videoUid: wId, // Using webinarId as reference
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

        // For PENDING or PROCESSING status, continue polling
        // Even if there's a transient error, worker may retry
        attempts++
        pollingRef.current = setTimeout(poll, 5000)
      } catch (err) {
        console.error('Error polling video status:', err)
        consecutiveErrors++

        // Only show error and stop after multiple consecutive failures
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setError(err instanceof Error ? err.message : 'Error checking processing status')
          setStatus('error')
          onError?.(err instanceof Error ? err.message : 'Error checking processing status')
          return
        }

        // Transient error, keep trying
        attempts++
        pollingRef.current = setTimeout(poll, 5000)
      }
    }

    // Add initial delay to allow R2 eventual consistency
    pollingRef.current = setTimeout(poll, 3000)
  }, [onUploadComplete, onError])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    // Validate file size (max 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10GB')
      return
    }

    if (!webinarId) {
      setError('Please save the webinar first before uploading video')
      return
    }

    setFileName(file.name)
    setError(null)
    setStatus('getting-url')

    try {
      // Get presigned upload URL from our API
      const urlRes = await fetch('/api/admin/webinars/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      })

      if (!urlRes.ok) {
        const errData = await urlRes.json()
        throw new Error(errData.error || 'Failed to get upload URL')
      }

      const { uploadUrl, jobId: jId } = await urlRes.json()
      setJobId(jId)

      // Upload directly to R2 using presigned URL
      setStatus('uploading')
      setProgress(0)

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          setProgress(percentage)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Upload complete, confirm with backend and start polling
          try {
            const confirmRes = await fetch('/api/admin/webinars/upload', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webinarId, jobId: jId }),
            })

            if (!confirmRes.ok) {
              const errData = await confirmRes.json()
              throw new Error(errData.error || 'Failed to confirm upload')
            }

            // Start polling for processing status
            pollVideoStatus(webinarId)
          } catch (err) {
            console.error('Confirm error:', err)
            setError(err instanceof Error ? err.message : 'Failed to confirm upload')
            setStatus('error')
            onError?.(err instanceof Error ? err.message : 'Failed to confirm upload')
          }
        } else {
          setError(`Upload failed with status ${xhr.status}`)
          setStatus('error')
          onError?.(`Upload failed with status ${xhr.status}`)
        }
      })

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please check your connection and try again.')
        setStatus('error')
        onError?.('Upload failed')
      })

      xhr.addEventListener('abort', () => {
        setStatus('idle')
        setProgress(0)
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    } catch (err) {
      console.error('Upload setup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start upload')
      setStatus('error')
      onError?.(err instanceof Error ? err.message : 'Failed to start upload')
    }
  }

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
    }
    setStatus('idle')
    setProgress(0)
    setFileName(null)
    setError(null)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getProcessingStatusText = () => {
    switch (processingStatus) {
      case 'PENDING':
        return 'Queued for processing...'
      case 'PROCESSING':
        return processingProgress > 0
          ? `Processing: ${processingProgress}%`
          : 'Processing video...'
      default:
        return 'Processing...'
    }
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
            Click to select a video file (max 10GB)
          </p>
          <p className="text-sm text-text-muted">
            Supported formats: MP4, MOV, MKV, WebM, AVI
          </p>
          {!webinarId && (
            <p className="text-sm text-amber-600 mt-4">
              Save the webinar first before uploading video
            </p>
          )}
        </div>
      )}

      {(status === 'getting-url' || status === 'uploading' || status === 'processing') && (
        <div className="border border-neu-dark rounded-neu p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="font-medium text-text-primary">
                {status === 'getting-url' && 'Preparing upload...'}
                {status === 'uploading' && `Uploading: ${fileName}`}
                {status === 'processing' && getProcessingStatusText()}
              </span>
            </div>
            {status === 'uploading' && (
              <button
                onClick={handleCancel}
                className="p-1 text-text-muted hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neu-dark rounded-full h-3 mb-2">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${status === 'processing' ? processingProgress : progress}%`,
              }}
            />
          </div>
          <p className="text-sm text-text-muted text-right">
            {status === 'uploading' && `${progress}% uploaded`}
            {status === 'processing' && (
              processingStatus === 'PENDING'
                ? 'Waiting for worker to start processing...'
                : processingProgress > 0
                  ? `${processingProgress}% transcoded`
                  : 'Transcoding to HLS format...'
            )}
          </p>

          {status === 'processing' && (
            <p className="text-xs text-text-muted mt-2">
              Video is being transcoded to multiple qualities (480p, 720p, 1080p).
              This may take several minutes depending on video length.
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
                {fileName} - Transcoded to multiple quality levels
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
