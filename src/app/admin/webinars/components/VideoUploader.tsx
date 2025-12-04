'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui'
import { X, Loader2, CheckCircle, AlertCircle, Video, Upload } from 'lucide-react'

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

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'complete' | 'error'

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
  const [fileSize, setFileSize] = useState<number>(0)
  const [bunnyStatus, setBunnyStatus] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error polling video status:', err)
        }
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

    // Validate file size (max 2GB for Bunny direct upload)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    if (file.size > maxSize) {
      setError('File size must be less than 2GB')
      return
    }

    if (!webinarId) {
      setError('Please save the webinar first before uploading video')
      return
    }

    setFileName(file.name)
    setFileSize(file.size)
    setError(null)
    setStatus('preparing')
    setProgress(0)

    try {
      // Step 1: Get upload credentials from our server
      if (process.env.NODE_ENV === 'development') {
        console.log('Getting upload credentials from server...')
      }
      const createRes = await fetch('/api/admin/webinars/upload/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webinarId, title: webinarTitle }),
      })

      if (!createRes.ok) {
        const errData = await createRes.json()
        throw new Error(errData.error || 'Failed to prepare upload')
      }

      const { videoId, uploadUrl, authKey } = await createRes.json()
      if (process.env.NODE_ENV === 'development') {
        console.log('Got upload credentials, videoId:', videoId)
      }

      // Step 2: Upload directly to Bunny using XHR for progress
      setStatus('uploading')

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setProgress(percentComplete)
          if (process.env.NODE_ENV === 'development') {
            console.log(`Direct upload progress: ${percentComplete}% (${formatFileSize(event.loaded)} / ${formatFileSize(event.total)})`)
          }
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Direct upload to Bunny complete!')
          }

          // Step 3: Notify our server that upload is complete
          try {
            await fetch('/api/admin/webinars/upload/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webinarId, videoId, fileSize: file.size }),
            })
          } catch (err) {
            console.error('Failed to notify server of upload completion:', err)
          }

          // Step 4: Start polling for transcoding status
          pollVideoStatus(webinarId)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('Bunny upload failed:', xhr.status, xhr.statusText)
          }
          let errorMessage = `Upload failed: ${xhr.status}`
          try {
            const responseText = xhr.responseText
            if (responseText) {
              errorMessage = `Upload failed: ${responseText}`
            }
          } catch {}
          setError(errorMessage)
          setStatus('error')
          onError?.(errorMessage)
        }
      })

      xhr.addEventListener('error', () => {
        if (process.env.NODE_ENV === 'development') {
          console.error('XHR error during direct upload')
        }
        setError('Network error during upload to Bunny')
        setStatus('error')
        onError?.('Network error during upload to Bunny')
      })

      xhr.addEventListener('abort', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Upload aborted')
        }
        setStatus('idle')
        setProgress(0)
      })

      // Upload directly to Bunny
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('AccessKey', authKey)
      xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      xhr.send(file)

    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Upload error:', err)
      }
      setError(err instanceof Error ? err.message : 'Failed to upload video')
      setStatus('error')
      onError?.(err instanceof Error ? err.message : 'Failed to upload video')
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
    setFileSize(0)
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
            Click to select a video file (max 2GB)
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

      {status === 'preparing' && (
        <div className="border border-neu-dark rounded-neu p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
            <span className="font-medium text-text-primary">
              Preparing upload...
            </span>
          </div>
        </div>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="border border-neu-dark rounded-neu p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {status === 'uploading' ? (
                <Upload className="w-5 h-5 text-primary-600" />
              ) : (
                <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
              )}
              <div>
                <span className="font-medium text-text-primary">
                  {status === 'uploading' && `Uploading to Bunny: ${fileName}`}
                  {status === 'processing' && getProcessingStatusText()}
                </span>
                {status === 'uploading' && fileSize > 0 && (
                  <span className="text-sm text-text-muted ml-2">
                    ({formatFileSize(fileSize)})
                  </span>
                )}
              </div>
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
            {status === 'uploading' && `${progress}% uploaded`}
            {status === 'processing' && (
              progress > 0 ? `${progress}% transcoded` : 'Waiting for Bunny to process...'
            )}
          </p>

          {status === 'uploading' && (
            <p className="text-xs text-text-muted mt-2">
              Uploading directly to Bunny Stream CDN for fast, reliable delivery.
            </p>
          )}

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
