'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Mic, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AudioRecorder } from '@/components/testimonials/AudioRecorder'
import { VideoRecorder } from '@/components/testimonials/VideoRecorder'

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
  const [mode, setMode] = useState<'choose' | 'audio' | 'video'>('choose')
  const [isUploading, setIsUploading] = useState(false)

  async function uploadMedia(blob: Blob, type: 'audio' | 'video') {
    setIsUploading(true)

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
    }
  }

  if (isUploading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-text-secondary">{t('uploading')}</p>
      </div>
    )
  }

  if (mode === 'audio') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {t('audioTitle')}
          </h2>
        </div>
        <AudioRecorder
          locale={locale}
          onRecordingComplete={(blob) => uploadMedia(blob, 'audio')}
          onUploadAudio={(file) => uploadMedia(file, 'audio')}
        />
        <div className="mt-6">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setMode('choose')}
          >
            {t('back')}
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'video') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {t('videoTitle')}
          </h2>
        </div>
        <VideoRecorder
          locale={locale}
          onRecordingComplete={(blob) => uploadMedia(blob, 'video')}
          onUploadVideo={(file) => uploadMedia(file, 'video')}
        />
        <div className="mt-6">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setMode('choose')}
          >
            {t('back')}
          </Button>
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

      <div className="space-y-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setMode('audio')}
        >
          <Mic className="w-5 h-5 mr-2" />
          {t('recordAudio')}
        </Button>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setMode('video')}
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
