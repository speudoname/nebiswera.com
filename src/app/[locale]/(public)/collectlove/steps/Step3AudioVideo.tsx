'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Mic, Video, Upload, Trash2, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AudioRecorder } from '../components/AudioRecorder'
import { VideoRecorder } from '../components/VideoRecorder'

interface Step3AudioVideoProps {
  testimonialId: string
  onComplete: () => void
  onSkip: () => void
}

export function Step3AudioVideo({
  testimonialId,
  onComplete,
  onSkip,
}: Step3AudioVideoProps) {
  const t = useTranslations('collectLove.step3')
  const locale = useLocale()
  const [expandedType, setExpandedType] = useState<'audio' | 'video' | null>(null)
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Preview state - blob to preview before final upload
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewType, setPreviewType] = useState<'audio' | 'video' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  // Cleanup preview URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function uploadMedia(blob: Blob, type: 'audio' | 'video') {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let url: string
      let thumbnailUrl: string | undefined

      if (type === 'video') {
        // Upload video to Bunny Stream - it handles transcoding and thumbnails
        const { uploadVideoToBunny } = await import('@/lib/storage/upload-helpers')
        const result = await uploadVideoToBunny(blob, `testimonial-${testimonialId}`)
        url = result.hlsUrl
        thumbnailUrl = result.thumbnailUrl
      } else {
        // Upload audio to R2
        const { uploadFileToR2 } = await import('@/lib/storage/upload-helpers')
        url = await uploadFileToR2(blob, type)
      }

      const updateRes = await fetch(`/api/testimonials/${testimonialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type === 'audio' ? 'audioUrl' : 'videoUrl']: url,
          ...(type === 'video' && thumbnailUrl ? { videoThumbnail: thumbnailUrl } : {}),
          type: type.toUpperCase(),
        }),
      })

      if (!updateRes.ok) throw new Error('Failed to save')

      // Clear preview and proceed
      clearPreview()
      onComplete()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  function showPreview(blob: Blob, type: 'audio' | 'video') {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const url = URL.createObjectURL(blob)
    setPreviewBlob(blob)
    setPreviewType(type)
    setPreviewUrl(url)
  }

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewBlob(null)
    setPreviewType(null)
    setPreviewUrl(null)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'video') {
    const file = e.target.files?.[0]
    if (!file) return

    const expectedType = type === 'audio' ? 'audio/' : 'video/'
    if (!file.type.startsWith(expectedType)) {
      alert(`Please select a valid ${type} file`)
      return
    }

    // Show preview instead of immediately uploading
    showPreview(file, type)
    setExpandedType(null)
  }

  function handleRecordingComplete(blob: Blob, type: 'audio' | 'video') {
    setRecordingMode(null)
    setExpandedType(null)
    // Show preview instead of immediately uploading
    showPreview(blob, type)
  }

  function handleConfirmUpload() {
    if (previewBlob && previewType) {
      uploadMedia(previewBlob, previewType)
    }
  }

  function handleRetake() {
    const type = previewType
    clearPreview()
    if (type) {
      setRecordingMode(type)
    }
  }

  // Show recorder interface
  if (recordingMode === 'audio') {
    return (
      <div className="max-w-2xl mx-auto">
        <AudioRecorder
          onRecordingComplete={(blob) => handleRecordingComplete(blob, 'audio')}
          onCancel={() => setRecordingMode(null)}
        />
      </div>
    )
  }

  if (recordingMode === 'video') {
    return (
      <div className="max-w-2xl mx-auto">
        <VideoRecorder
          onRecordingComplete={(blob) => handleRecordingComplete(blob, 'video')}
          onCancel={() => setRecordingMode(null)}
        />
      </div>
    )
  }

  // Show preview screen if we have a blob to preview
  if (previewBlob && previewType && previewUrl) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {locale === 'ka' ? 'გადახედეთ თქვენს ჩანაწერს' : 'Review Your Recording'}
          </h2>
          <p className="text-text-secondary">
            {locale === 'ka'
              ? 'გთხოვთ გადახედოთ და დაადასტუროთ ან გადაიღოთ თავიდან'
              : 'Please review and confirm or retake'}
          </p>
        </div>

        <div className="p-6 bg-neu-base rounded-neu-lg shadow-neu-md">
          {/* Preview Player */}
          <div className="mb-6 rounded-neu overflow-hidden bg-black">
            {previewType === 'video' ? (
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                controls
                playsInline
                className="w-full aspect-video"
              />
            ) : (
              <div className="p-8 flex flex-col items-center justify-center bg-neu-base">
                <Mic className="w-16 h-16 text-primary-500 mb-4" />
                <audio
                  src={previewUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isUploading ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-secondary">{t('uploading')}</p>
              {uploadProgress > 0 && (
                <p className="text-sm text-text-muted mt-2">{uploadProgress}%</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={handleRetake}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  {locale === 'ka' ? 'თავიდან გადაღება' : 'Retake'}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={clearPreview}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {locale === 'ka' ? 'გაუქმება' : 'Discard'}
                </Button>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirmUpload}
              >
                <Check className="w-5 h-5 mr-2" />
                {locale === 'ka' ? 'დადასტურება და გაგრძელება' : 'Confirm & Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-4">
          {t('title')}
        </h2>
        <p className="text-lg text-text-secondary mb-2">
          {t('motivation')}
        </p>
        <p className="text-text-muted">
          {t('motivationSub')}
        </p>
      </div>

      {isUploading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">{t('uploading')}</p>
          {uploadProgress > 0 && (
            <p className="text-sm text-text-muted mt-2">{uploadProgress}%</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audio Button - Expands to show Record/Upload */}
          <div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setExpandedType(expandedType === 'audio' ? null : 'audio')}
            >
              <Mic className="w-5 h-5 mr-2" />
              {t('recordAudio')}
            </Button>

            {expandedType === 'audio' && (
              <div className="mt-3 flex gap-3 pl-4">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setRecordingMode('audio')}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {t('record')}
                </Button>

                <label className="flex-1">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'audio')}
                    className="hidden"
                  />
                  <span className="inline-flex w-full items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 px-6 py-3 text-sm gap-2 bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover hover:bg-neu-light active:shadow-neu-pressed cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {t('upload')}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Video Button - Expands to show Record/Upload */}
          <div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setExpandedType(expandedType === 'video' ? null : 'video')}
            >
              <Video className="w-5 h-5 mr-2" />
              {t('recordVideo')}
            </Button>

            {expandedType === 'video' && (
              <div className="mt-3 flex gap-3 pl-4">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setRecordingMode('video')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {t('record')}
                </Button>

                <label className="flex-1">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    className="hidden"
                  />
                  <span className="inline-flex w-full items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 px-6 py-3 text-sm gap-2 bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover hover:bg-neu-light active:shadow-neu-pressed cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {t('upload')}
                  </span>
                </label>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onSkip}
          >
            {t('skip')}
          </Button>
        </div>
      )}
    </div>
  )
}
