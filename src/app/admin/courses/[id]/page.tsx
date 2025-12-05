'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  Globe,
  Send,
  Archive,
  BookOpen,
  Layers,
  Users,
  BarChart3,
  Bell,
  FileQuestion,
  Settings,
  ExternalLink,
} from 'lucide-react'
import type { CourseSettings } from '@/lib/lms/types'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  locale: string
  accessType: 'OPEN' | 'FREE' | 'PAID'
  price: number | null
  currency: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  settings: CourseSettings
  version: number
  createdAt: string
  publishedAt: string | null
  _count: {
    modules: number
    lessons: number
    enrollments: number
  }
}

export default function CourseEditorPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    locale: 'ka',
    accessType: 'FREE',
    price: '',
    currency: 'GEL',
  })

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
        setFormData({
          title: data.title,
          slug: data.slug,
          description: data.description || '',
          locale: data.locale,
          accessType: data.accessType,
          price: data.price?.toString() || '',
          currency: data.currency || 'GEL',
        })
      } else {
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      router.push('/admin/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setCourse(prev => prev ? { ...prev, ...data } : null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save course')
      }
    } catch (error) {
      console.error('Failed to save course:', error)
      alert('Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (action: 'publish' | 'unpublish' | 'archive') => {
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        const data = await res.json()
        setCourse(prev => prev ? { ...prev, status: data.status, publishedAt: data.publishedAt } : null)
      } else {
        const data = await res.json()
        alert(data.error || `Failed to ${action} course`)
      }
    } catch (error) {
      console.error(`Failed to ${action} course:`, error)
      alert(`Failed to ${action} course`)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!course) {
    return null
  }

  const navigationItems = [
    { href: `/admin/courses/${id}/content`, icon: BookOpen, label: 'Content Builder', description: 'Modules, lessons, and parts' },
    { href: `/admin/courses/${id}/quizzes`, icon: FileQuestion, label: 'Quizzes', description: 'Create assessments' },
    { href: `/admin/courses/${id}/students`, icon: Users, label: 'Students', description: `${course._count.enrollments} enrolled` },
    { href: `/admin/courses/${id}/notifications`, icon: Bell, label: 'Notifications', description: 'Email automations' },
    { href: `/admin/courses/${id}/analytics`, icon: BarChart3, label: 'Analytics', description: 'Performance metrics' },
    { href: `/admin/courses/${id}/settings`, icon: Settings, label: 'Settings', description: 'Course configuration' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/courses"
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">{course.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                course.status === 'ARCHIVED' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {course.status}
              </span>
            </div>
            <p className="text-text-muted">
              <span className="font-mono text-sm">/{course.locale}/courses/{course.slug}</span>
              {course.publishedAt && (
                <span className="ml-3">
                  Published {new Date(course.publishedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {course.status === 'PUBLISHED' && (
              <a
                href={`/${course.locale}/courses/${course.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-text-muted hover:text-primary-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {course.status === 'DRAFT' && (
              <Button
                onClick={() => handlePublish('publish')}
                disabled={publishing}
              >
                {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Publish
              </Button>
            )}

            {course.status === 'PUBLISHED' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handlePublish('unpublish')}
                  disabled={publishing}
                >
                  Unpublish
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePublish('archive')}
                  disabled={publishing}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </>
            )}

            {course.status === 'ARCHIVED' && (
              <Button
                onClick={() => handlePublish('publish')}
                disabled={publishing}
              >
                {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Republish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="col-span-2 space-y-6">
          <div className="bg-neu-light rounded-neu shadow-neu p-6 space-y-6">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basic Information
            </h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Course Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                URL Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none font-mono text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  <option value="OPEN">Open (No login)</option>
                  <option value="FREE">Free (Login required)</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>

            {/* Price (if PAID) */}
            {formData.accessType === 'PAID' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                  >
                    <option value="GEL">GEL (₾)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-neu-dark">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Navigation */}
        <div className="space-y-4">
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
              Course Management
            </h3>
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-neu-base transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-text-primary group-hover:text-primary-600 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-text-muted">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          {/* Stats */}
          <div className="bg-neu-light rounded-neu shadow-neu p-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
              Course Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Modules
                </span>
                <span className="font-semibold text-text-primary">{course._count.modules}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Lessons
                </span>
                <span className="font-semibold text-text-primary">{course._count.lessons}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Students
                </span>
                <span className="font-semibold text-text-primary">{course._count.enrollments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Version
                </span>
                <span className="font-semibold text-text-primary">v{course.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
