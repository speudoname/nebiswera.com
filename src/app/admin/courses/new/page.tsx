'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DEFAULT_COURSE_SETTINGS } from '@/lib/lms/types'

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    locale: 'ka',
    accessType: 'FREE',
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          settings: DEFAULT_COURSE_SETTINGS,
        }),
      })

      if (res.ok) {
        const course = await res.json()
        router.push(`/admin/courses/${course.id}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('Failed to create course:', error)
      alert('Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/admin/courses"
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create New Course</h1>
        <p className="text-text-secondary">Start by setting up the basic information</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-neu-light rounded-neu shadow-neu p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Course Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Enter course title..."
            required
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            URL Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm">/courses/</span>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="course-slug"
              className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none font-mono text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Leave empty to auto-generate from title
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the course..."
            rows={4}
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
          />
        </div>

        {/* Language & Access Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Language
            </label>
            <select
              value={formData.locale}
              onChange={(e) => setFormData(prev => ({ ...prev, locale: e.target.value }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="ka">Georgian (ქართული)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Access Type
            </label>
            <select
              value={formData.accessType}
              onChange={(e) => setFormData(prev => ({ ...prev, accessType: e.target.value }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="OPEN">Open (No login required)</option>
              <option value="FREE">Free (Login required)</option>
              <option value="PAID">Paid (Enrollment required)</option>
            </select>
          </div>
        </div>

        <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-800">
          <strong>Next steps:</strong> After creating the course, you&apos;ll be able to:
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Add modules, lessons, and parts</li>
            <li>Create content blocks (text, video, audio, etc.)</li>
            <li>Set up quizzes and assessments</li>
            <li>Configure notifications</li>
            <li>Manage enrollments</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neu-dark">
          <Link href="/admin/courses">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !formData.title}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Course'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
