'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

type Testimonial = {
  id: string
  name: string
  email: string | null
  role: string | null
  company: string | null
  text: string
  rating: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  type: 'TEXT' | 'AUDIO' | 'VIDEO'
  locale: string
  profilePhoto: string | null
  images: string[]
  audioUrl: string | null
  videoUrl: string | null
  submittedAt: string
  source: string | null
}

export function TestimonialEditForm({ id }: { id: string }) {
  const router = useRouter()
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTestimonial()
  }, [id])

  async function fetchTestimonial() {
    try {
      const res = await fetch(`/api/testimonials/${id}`)
      const data = await res.json()
      setTestimonial(data.testimonial)
    } catch (error) {
      console.error('Error fetching testimonial:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!testimonial) return

    setSaving(true)
    try {
      await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonial),
      })
      router.push('/admin/testimonials')
    } catch (error) {
      console.error('Error saving testimonial:', error)
      alert('Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!testimonial) {
    return <div className="text-center py-12">Testimonial not found</div>
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft />}
        onClick={() => router.back()}
        className="mb-6"
      >
        Back
      </Button>

      <Card variant="raised" padding="lg">
        <div className="space-y-6">
          {/* Name */}
          <Input
            label="Name"
            value={testimonial.name}
            onChange={(e) => setTestimonial({ ...testimonial, name: e.target.value })}
          />

          {/* Email */}
          <Input
            label="Email"
            type="email"
            value={testimonial.email || ''}
            onChange={(e) => setTestimonial({ ...testimonial, email: e.target.value })}
          />

          {/* Role */}
          <Input
            label="Role"
            value={testimonial.role || ''}
            onChange={(e) => setTestimonial({ ...testimonial, role: e.target.value })}
          />

          {/* Company */}
          <Input
            label="Company"
            value={testimonial.company || ''}
            onChange={(e) => setTestimonial({ ...testimonial, company: e.target.value })}
          />

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Testimonial Text
            </label>
            <textarea
              value={testimonial.text}
              onChange={(e) => setTestimonial({ ...testimonial, text: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rating
            </label>
            <select
              value={testimonial.rating}
              onChange={(e) => setTestimonial({ ...testimonial, rating: parseInt(e.target.value) })}
              className="px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <select
              value={testimonial.status}
              onChange={(e) => setTestimonial({ ...testimonial, status: e.target.value as any })}
              className="px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Type
            </label>
            <select
              value={testimonial.type}
              onChange={(e) => setTestimonial({ ...testimonial, type: e.target.value as any })}
              className="px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary"
            >
              <option value="TEXT">Text</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>

          {/* Locale */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Language
            </label>
            <select
              value={testimonial.locale}
              onChange={(e) => setTestimonial({ ...testimonial, locale: e.target.value })}
              className="px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary"
            >
              <option value="ka">Georgian (ქართული)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Media Preview */}
          {testimonial.profilePhoto && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Profile Photo
              </label>
              <img
                src={testimonial.profilePhoto}
                alt={testimonial.name}
                className="w-24 h-24 rounded-full object-cover shadow-neu"
              />
            </div>
          )}

          {testimonial.videoUrl && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Video URL
              </label>
              <p className="text-sm text-text-secondary">{testimonial.videoUrl}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-neu-dark">
            <p className="text-sm text-text-secondary">
              <strong>Submitted:</strong> {new Date(testimonial.submittedAt).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              <strong>Source:</strong> {testimonial.source || 'Unknown'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="primary"
              leftIcon={<Save />}
              onClick={handleSave}
              loading={saving}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
