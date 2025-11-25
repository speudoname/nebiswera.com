'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Mic, Video, Upload } from 'lucide-react'
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

  async function uploadMedia(blob: Blob, type: 'audio' | 'video') {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const { uploadFileToR2 } = await import('@/lib/storage/upload-helpers')
      const url = await uploadFileToR2(blob, type)

      // Generate and upload thumbnail for videos
      let thumbnailUrl: string | undefined
      if (type === 'video') {
        try {
          const { generateVideoThumbnail } = await import('@/lib/storage/video-thumbnail')
          const thumbnailBlob = await generateVideoThumbnail(blob, 1)
          thumbnailUrl = await uploadFileToR2(thumbnailBlob, 'image')
        } catch (error) {
          console.error('Failed to generate video thumbnail:', error)
          // Continue without thumbnail - not critical
        }
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

      onComplete()
    } catch (error: any) {
      alert(error.message)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'video') {
    const file = e.target.files?.[0]
    if (!file) return

    const expectedType = type === 'audio' ? 'audio/' : 'video/'
    if (!file.type.startsWith(expectedType)) {
      alert(`Please select a valid ${type} file`)
      return
    }

    uploadMedia(file, type)
  }

  function handleRecordingComplete(blob: Blob, type: 'audio' | 'video') {
    setRecordingMode(null)
    setExpandedType(null)
    uploadMedia(blob, type)
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
                  Record
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
                  Record
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
