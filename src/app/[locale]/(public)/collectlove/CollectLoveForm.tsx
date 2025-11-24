'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Star, Send, Upload, X, User, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AudioRecorder } from '@/components/testimonials/AudioRecorder'
import { VideoRecorder } from '@/components/testimonials/VideoRecorder'

export function CollectLoveForm() {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    text: '',
    rating: 5,
  })

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [mediaType, setMediaType] = useState<'TEXT' | 'AUDIO' | 'VIDEO'>('TEXT')

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([])

  const t = {
    ka: {
      title: 'გააზიარე შენი გამოცდილება',
      subtitle: 'გქონდა გამოცდილება ნებისწერასთან? გვიზიარე შენი აზრი',
      nameLabel: 'სახელი',
      namePlaceholder: 'შენი სახელი',
      emailLabel: 'ელ-ფოსტა',
      emailPlaceholder: 'email@example.com',
      textLabel: 'შენი გამოცდილება',
      textPlaceholder: 'გვიზიარე რა გამოცდილება გქონდა ნებისწერასთან, როგორ შეცვალა შენი ცხოვრება...',
      ratingLabel: 'შეფასება',
      submitBtn: 'გაგზავნა',
      submitting: 'იგზავნება...',
      successTitle: 'მადლობა!',
      successMessage: 'შენი გამოცდილება მიღებულია. დაუმტკიცდება ადმინისტრატორს და მალე გამოჩნდება.',
      backBtn: 'უკან დაბრუნება',
      audioLabel: 'აუდიო ჩაწერა/ატვირთვა',
      videoLabel: 'ვიდეო ჩაწერა/ატვირთვა',
      optionalMedia: '(არასავალდებულო)',
      profilePhotoLabel: 'პროფილის ფოტო',
      profilePhotoDesc: 'ატვირთე შენი ფოტო',
      additionalImagesLabel: 'დამატებითი სურათები',
      additionalImagesDesc: 'ატვირთე დამატებითი სურათები (მაქს. 3)',
      uploadBtn: 'ატვირთვა',
      removeBtn: 'წაშლა',
    },
    en: {
      title: 'Share Your Experience',
      subtitle: 'Had an experience with Nebiswera? Share your thoughts',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'email@example.com',
      textLabel: 'Your Experience',
      textPlaceholder: 'Share your experience with Nebiswera, how it changed your life...',
      ratingLabel: 'Rating',
      submitBtn: 'Submit',
      submitting: 'Submitting...',
      successTitle: 'Thank You!',
      successMessage: 'Your testimonial has been received. It will be reviewed by an administrator and published soon.',
      backBtn: 'Go Back',
      audioLabel: 'Record/Upload Audio',
      videoLabel: 'Record/Upload Video',
      optionalMedia: '(Optional)',
      profilePhotoLabel: 'Profile Photo',
      profilePhotoDesc: 'Upload your photo',
      additionalImagesLabel: 'Additional Images',
      additionalImagesDesc: 'Upload additional images (max 3)',
      uploadBtn: 'Upload',
      removeBtn: 'Remove',
    },
  }[locale as 'ka' | 'en']

  async function uploadFile(blob: Blob, type: 'audio' | 'video'): Promise<string | null> {
    try {
      const formData = new FormData()
      const file = new File([blob], `${type}.webm`, { type: blob.type })
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        return data.url
      }
      return null
    } catch (error) {
      console.error(`Error uploading ${type}:`, error)
      return null
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        return data.url
      }
      return null
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleAdditionalImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith('image/')).slice(0, 3 - additionalImages.length)

    if (imageFiles.length > 0) {
      setAdditionalImages([...additionalImages, ...imageFiles])

      // Generate previews
      imageFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAdditionalImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index))
    setAdditionalImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.text) {
      alert(locale === 'ka' ? 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი' : 'Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      // Upload audio/video files to R2 if present
      let audioUrl: string | null = null
      let videoUrl: string | null = null
      let profilePhotoUrl: string | null = null
      const imageUrls: string[] = []

      if (audioBlob) {
        audioUrl = await uploadFile(audioBlob, 'audio')
      }

      if (videoBlob) {
        videoUrl = await uploadFile(videoBlob, 'video')
      }

      if (profilePhoto) {
        profilePhotoUrl = await uploadImage(profilePhoto)
      }

      // Upload additional images
      for (const image of additionalImages) {
        const url = await uploadImage(image)
        if (url) imageUrls.push(url)
      }

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          locale,
          type: mediaType,
          audioUrl,
          videoUrl,
          profilePhoto: profilePhotoUrl,
          images: imageUrls,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        alert(locale === 'ka' ? 'შეცდომა. გთხოვთ სცადოთ ხელახლა' : 'Error. Please try again')
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      alert(locale === 'ka' ? 'შეცდომა. გთხოვთ სცადოთ ხელახლა' : 'Error. Please try again')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center px-4">
        <Card variant="raised" padding="lg" className="max-w-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-4">{t.successTitle}</h2>
          <p className="text-text-secondary mb-8">{t.successMessage}</p>
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/love`)}
          >
            {t.backBtn}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neu-base py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">{t.title}</h1>
          <p className="text-lg text-text-secondary">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card variant="raised" padding="lg">
            <div className="space-y-6">
              {/* Name */}
              <Input
                label={t.nameLabel}
                placeholder={t.namePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              {/* Email */}
              <Input
                label={t.emailLabel}
                type="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              {/* Testimonial Text */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.textLabel} *
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder={t.textPlaceholder}
                  rows={6}
                  maxLength={500}
                  required
                  className="w-full px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {formData.text.length}/500
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.ratingLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: r })}
                      className="p-2 rounded-full hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          r <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-neu-dark'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="pt-4 border-t border-neu-dark">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.profilePhotoLabel} <span className="text-text-secondary text-xs">{t.optionalMedia}</span>
                </label>
                <p className="text-sm text-text-secondary mb-3">{t.profilePhotoDesc}</p>
                <div className="flex items-center gap-4">
                  {profilePhotoPreview ? (
                    <div className="relative">
                      <img
                        src={profilePhotoPreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover shadow-neu"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhoto(null)
                          setProfilePhotoPreview(null)
                        }}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-neu hover:shadow-neu-hover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-neu-base shadow-neu-inset flex items-center justify-center hover:shadow-neu-hover transition-shadow">
                        <User className="w-10 h-10 text-text-secondary" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  {!profilePhotoPreview && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                        id="profile-photo-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={Upload}
                        onClick={() => document.getElementById('profile-photo-input')?.click()}
                      >
                        {t.uploadBtn}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images Upload */}
              <div className="pt-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.additionalImagesLabel} <span className="text-text-secondary text-xs">{t.optionalMedia}</span>
                </label>
                <p className="text-sm text-text-secondary mb-3">{t.additionalImagesDesc}</p>
                <div className="space-y-3">
                  {/* Image previews */}
                  {additionalImagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {additionalImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Image ${idx + 1}`}
                            className="w-24 h-24 rounded-neu object-cover shadow-neu"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(idx)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-neu hover:shadow-neu-hover"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Upload button */}
                  {additionalImages.length < 3 && (
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-3 rounded-neu bg-neu-base shadow-neu hover:shadow-neu-hover transition-shadow">
                        <ImageIcon className="w-5 h-5 text-text-secondary" />
                        <span className="text-sm text-text-secondary">
                          {additionalImages.length === 0
                            ? t.uploadBtn
                            : `${t.uploadBtn} (${additionalImages.length}/3)`}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImagesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Audio Recording */}
              <div className="pt-4 border-t border-neu-dark">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.audioLabel} <span className="text-text-secondary text-xs">{t.optionalMedia}</span>
                </label>
                <AudioRecorder
                  onRecordingComplete={(blob) => {
                    setAudioBlob(blob)
                    setMediaType('AUDIO')
                  }}
                  onUploadAudio={(file) => {
                    setAudioBlob(file)
                    setMediaType('AUDIO')
                  }}
                  locale={locale}
                />
              </div>

              {/* Video Recording */}
              <div className="pt-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.videoLabel} <span className="text-text-secondary text-xs">{t.optionalMedia}</span>
                </label>
                <VideoRecorder
                  onRecordingComplete={(blob) => {
                    setVideoBlob(blob)
                    setMediaType('VIDEO')
                  }}
                  onUploadVideo={(file) => {
                    setVideoBlob(file)
                    setMediaType('VIDEO')
                  }}
                  locale={locale}
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  loadingText={t.submitting}
                  leftIcon={Send}
                  className="w-full"
                >
                  {t.submitBtn}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
