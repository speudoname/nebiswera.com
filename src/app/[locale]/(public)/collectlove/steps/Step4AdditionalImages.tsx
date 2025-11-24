'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Step2AdditionalImagesProps {
  testimonialId: string
  onComplete: () => void
  onSkip: () => void
}

export function Step2AdditionalImages({
  testimonialId,
  onComplete,
  onSkip,
}: Step2AdditionalImagesProps) {
  const t = useTranslations('collectLove.step2Images')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    const remainingSlots = 3 - images.length
    const newImages = imageFiles.slice(0, remainingSlots)

    if (newImages.length > 0) {
      setImages([...images, ...newImages])

      newImages.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (images.length === 0) {
      onSkip()
      return
    }

    setIsUploading(true)

    try {
      const imageUrls: string[] = []

      for (const image of images) {
        const formData = new FormData()
        formData.append('file', image)
        formData.append('type', 'image')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) throw new Error('Upload failed')

        const { url } = await uploadRes.json()
        imageUrls.push(url)
      }

      const updateRes = await fetch(`/api/testimonials/${testimonialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imageUrls }),
      })

      if (!updateRes.ok) throw new Error('Failed to save')

      onComplete()
    } catch (error: any) {
      alert(error.message)
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('title')}
        </h2>
        <p className="text-text-secondary">
          {t('description')}
        </p>
      </div>

      {isUploading ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">{t('uploading')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload area */}
          {images.length < 3 && (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-neu-dark rounded-neu-lg p-12 text-center cursor-pointer hover:bg-neu-light transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                <p className="text-text-primary font-medium mb-1">
                  {t('uploadLabel')}
                </p>
                <p className="text-sm text-text-secondary">
                  {t('uploadHint', { count: 3 - images.length })}
                </p>
              </div>
            </label>
          )}

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-neu overflow-hidden shadow-neu group"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-neu-sm hover:bg-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-4">
            {images.length > 0 && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
              >
                {t('continue')}
              </Button>
            )}

            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onSkip}
            >
              {images.length > 0 ? t('continueWithout') : t('skip')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
