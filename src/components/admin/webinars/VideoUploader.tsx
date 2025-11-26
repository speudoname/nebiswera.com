'use client'

import { useState, useRef, useCallback } from 'react'
import * as tus from 'tus-js-client'
import { Button } from '@/components/ui'
import { Upload, X, Loader2, CheckCircle, AlertCircle, Video } from 'lucide-react'

interface VideoUploaderProps {
  webinarId?: string
  webinarTitle?: string
  onUploadComplete: (videoData: {
    videoUid: string
    duration: number
    thumbnail: string
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
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [videoUid, setVideoUid] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<tus.Upload | null>(null)

  const pollVideoStatus = useCallback(async (uid: string) => {
    setStatus('processing')
    setProcessingProgress(0)

    const maxAttempts = 120 // 10 minutes max (5s intervals)
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`/api/admin/webinars/upload?uid=${uid}`)
        const data = await res.json()

        if (data.status === 'ready' && data.readyToStream) {
          setStatus('complete')
          onUploadComplete({
            videoUid: uid,
            duration: Math.round(data.duration),
            thumbnail: data.thumbnail,
          })
          return
        }

        if (data.status === 'error') {
          throw new Error('Video processing failed')
        }

        if (data.pctComplete) {
          setProcessingProgress(data.pctComplete)
        }

        attempts++
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (err) {
        console.error('Error polling video status:', err)
        attempts++
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    setError('Video processing timed out. Please try again.')
    setStatus('error')
    onError?.('Video processing timed out')
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

    setFileName(file.name)
    setError(null)
    setStatus('getting-url')

    try {
      // Get direct upload URL from our API
      const urlRes = await fetch('/api/admin/webinars/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId,
          webinarTitle: webinarTitle || file.name,
        }),
      })

      if (!urlRes.ok) {
        const errData = await urlRes.json()
        throw new Error(errData.error || 'Failed to get upload URL')
      }

      const { uploadURL, videoUid: uid } = await urlRes.json()
      setVideoUid(uid)

      // Start TUS upload
      setStatus('uploading')
      setProgress(0)

      const upload = new tus.Upload(file, {
        endpoint: uploadURL,
        uploadUrl: uploadURL, // Direct upload URL from Cloudflare
        chunkSize: 50 * 1024 * 1024, // 50MB chunks
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: (err) => {
          console.error('Upload error:', err)
          setError(err.message || 'Upload failed')
          setStatus('error')
          onError?.(err.message || 'Upload failed')
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          setProgress(percentage)
        },
        onSuccess: () => {
          // Upload complete, now wait for processing
          pollVideoStatus(uid)
        },
      })

      uploadRef.current = upload
      upload.start()
    } catch (err) {
      console.error('Upload setup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start upload')
      setStatus('error')
      onError?.(err instanceof Error ? err.message : 'Failed to start upload')
    }
  }

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort()
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
    setStatus('idle')
    setProgress(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
                {status === 'processing' && 'Processing video...'}
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
            {status === 'processing' && processingProgress > 0
              ? `${processingProgress}% processed`
              : 'Processing...'}
          </p>
        </div>
      )}

      {status === 'complete' && (
        <div className="border border-green-200 bg-green-50 rounded-neu p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Upload Complete!</h4>
              <p className="text-sm text-green-600">{fileName}</p>
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
