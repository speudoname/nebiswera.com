'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Camera, Upload, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CameraCapture } from '../components/CameraCapture'

interface Step2ProfilePhotoProps {
  testimonialId: string
  onComplete: () => void
  onSkip: () => void
}

export function Step2ProfilePhoto({
  testimonialId,
  onComplete,
  onSkip,
}: Step2ProfilePhotoProps) {
  const t = useTranslations('collectLove.step2')
  const [mode, setMode] = useState<'choose' | 'camera' | 'upload'>('choose')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function uploadPhoto(blob: Blob) {
    setIsUploading(true)

    try {
      const { uploadFileToR2 } = await import('@/lib/storage/upload-helpers')
      const url = await uploadFileToR2(blob, 'image')

      const updateRes = await fetch(`/api/testimonials/${testimonialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: url }),
      })

      if (!updateRes.ok) throw new Error('Failed to save')

      onComplete()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed')
      setIsUploading(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setPreviewUrl(URL.createObjectURL(file))
    uploadPhoto(file)
  }

  if (mode === 'camera') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {t('title')}
          </h2>
        </div>
        <CameraCapture
          onCapture={uploadPhoto}
          onCancel={() => setMode('choose')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('title')}
        </h2>
        <p className="text-text-secondary mb-6">
          {t('description')}
        </p>

        {/* Visual Example */}
        <Card variant="raised" padding="md" className="inline-block mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm text-text-secondary">{t('example')}</p>
              <p className="text-xs text-text-muted">{t('exampleDesc')}</p>
            </div>
          </div>
        </Card>
      </div>

      {isUploading ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">{t('uploading')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setMode('camera')}
          >
            <Camera className="w-5 h-5 mr-2" />
            {t('takePhoto')}
          </Button>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="inline-flex w-full items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 px-8 py-4 text-base gap-2 bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover hover:bg-neu-light active:shadow-neu-pressed cursor-pointer">
              <Upload className="w-5 h-5" />
              {t('uploadPhoto')}
            </span>
          </label>

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
