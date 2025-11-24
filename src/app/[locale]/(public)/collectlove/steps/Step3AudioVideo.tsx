'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Mic, Video, Upload, Play, Pause, Trash2, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
  const [selectedType, setSelectedType] = useState<'audio' | 'video' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  async function uploadMedia(blob: Blob, type: 'audio' | 'video') {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', blob, `testimonial.${type === 'audio' ? 'webm' : 'webm'}`)
      formData.append('type', type)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const { url } = await uploadRes.json()

      const updateRes = await fetch(`/api/testimonials/${testimonialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type === 'audio' ? 'audioUrl' : 'videoUrl']: url,
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

  if (isUploading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">{t('uploading')}</p>
          {uploadProgress > 0 && (
            <p className="text-sm text-text-muted mt-2">{uploadProgress}%</p>
          )}
        </div>
      </div>
    )
  }

  if (!selectedType) {
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

        <div className="space-y-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setSelectedType('audio')}
          >
            <Mic className="w-5 h-5 mr-2" />
            {t('recordAudio')}
          </Button>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setSelectedType('video')}
          >
            <Video className="w-5 h-5 mr-2" />
            {t('recordVideo')}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onSkip}
          >
            {t('skip')}
          </Button>
        </div>
      </div>
    )
  }

  // Show audio/video recorder with record and upload options
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {selectedType === 'audio' ? t('audioTitle') : t('videoTitle')}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Record or Upload section will be added here */}
        <p className="text-center text-text-secondary">
          Recording feature will be implemented with record/upload options
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setSelectedType(null)}
          >
            {t('back')}
          </Button>

          <label className="flex-1">
            <input
              type="file"
              accept={selectedType === 'audio' ? 'audio/*' : 'video/*'}
              onChange={(e) => handleFileUpload(e, selectedType)}
              className="hidden"
            />
            <span className="inline-flex w-full items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 px-8 py-4 text-base gap-2 bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover hover:bg-neu-light active:shadow-neu-pressed cursor-pointer">
              <Upload className="w-5 h-5" />
              {t('upload')}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
