'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Save,
  Settings,
  Clock,
  Lock,
  Award,
  Calendar,
  Percent,
  RefreshCw,
  Info,
} from 'lucide-react'
import type { CourseSettings } from '@/lib/lms/types'
import { DEFAULT_COURSE_SETTINGS } from '@/lib/lms/types'

interface Course {
  id: string
  title: string
  slug: string
  settings: CourseSettings
}

export default function CourseSettingsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [settings, setSettings] = useState<CourseSettings>(DEFAULT_COURSE_SETTINGS)

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
        setSettings({ ...DEFAULT_COURSE_SETTINGS, ...data.settings })
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
        body: JSON.stringify({ settings }),
      })

      if (res.ok) {
        setHasChanges(false)
        const data = await res.json()
        setCourse(prev => prev ? { ...prev, settings: data.settings } : null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof CourseSettings>(key: K, value: CourseSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_COURSE_SETTINGS)
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${id}`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary-600" />
              Course Settings
            </h1>
            <p className="text-text-muted">{course.title}</p>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
            )}
            <Button variant="secondary" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Video Completion */}
        <div className="bg-neu-light rounded-neu shadow-neu p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Percent className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Video Completion</h2>
              <p className="text-sm text-text-muted">Auto-complete threshold for video content</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Completion Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.videoCompletionThreshold}
                onChange={(e) => updateSetting('videoCompletionThreshold', parseInt(e.target.value) || 0)}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
              <p className="mt-2 text-xs text-text-muted">
                Video parts will auto-complete when students watch this percentage
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Default: 90%. Setting to 100% requires watching the entire video.
              </p>
            </div>
          </div>
        </div>

        {/* Content Lock */}
        <div className="bg-neu-light rounded-neu shadow-neu p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Sequential Lock</h2>
              <p className="text-sm text-text-muted">Control content access order</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sequentialLock}
                onChange={(e) => updateSetting('sequentialLock', e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <div>
                <div className="font-medium text-text-primary">Enable Sequential Lock</div>
                <div className="text-sm text-text-muted">
                  Students must complete previous content before accessing next
                </div>
              </div>
            </label>

            {settings.sequentialLock && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Content will be locked until prerequisites are completed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drip Content */}
        <div className="bg-neu-light rounded-neu shadow-neu p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Drip Content</h2>
              <p className="text-sm text-text-muted">Release content over time</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dripContent}
                onChange={(e) => updateSetting('dripContent', e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <div>
                <div className="font-medium text-text-primary">Enable Drip Content</div>
                <div className="text-sm text-text-muted">
                  Release content gradually after enrollment
                </div>
              </div>
            </label>

            {settings.dripContent && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Days Between Unlocks
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.dripIntervalDays}
                  onChange={(e) => updateSetting('dripIntervalDays', parseInt(e.target.value) || 1)}
                  className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                />
                <p className="mt-2 text-xs text-text-muted">
                  New modules/lessons unlock every {settings.dripIntervalDays} day(s)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Access Expiration */}
        <div className="bg-neu-light rounded-neu shadow-neu p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Access Expiration</h2>
              <p className="text-sm text-text-muted">Limit course access duration</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.expirationDays !== null}
                onChange={(e) => updateSetting('expirationDays', e.target.checked ? 365 : null)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <div>
                <div className="font-medium text-text-primary">Enable Expiration</div>
                <div className="text-sm text-text-muted">
                  Course access expires after a set period
                </div>
              </div>
            </label>

            {settings.expirationDays !== null && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Days Until Expiration
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.expirationDays}
                  onChange={(e) => updateSetting('expirationDays', parseInt(e.target.value) || 365)}
                  className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                />
                <p className="mt-2 text-xs text-text-muted">
                  Access expires {settings.expirationDays} days after enrollment
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-neu-light rounded-neu shadow-neu p-6 col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Certificates</h2>
              <p className="text-sm text-text-muted">Course completion certificates</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.certificateEnabled}
                onChange={(e) => updateSetting('certificateEnabled', e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <div>
                <div className="font-medium text-text-primary">Enable Certificates</div>
                <div className="text-sm text-text-muted">
                  Issue certificates when students complete the course
                </div>
              </div>
            </label>

            {settings.certificateEnabled && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Certificate Template
                </label>
                <select
                  value={settings.certificateTemplate || ''}
                  onChange={(e) => updateSetting('certificateTemplate', e.target.value || null)}
                  className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">Default Template</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Professional</option>
                  <option value="elegant">Elegant</option>
                </select>
                <p className="mt-2 text-xs text-text-muted">
                  Certificate designer coming soon. For now, use default template.
                </p>
              </div>
            )}

            {settings.certificateEnabled && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <p className="text-sm text-purple-700">
                  Students will receive a downloadable PDF certificate upon completion
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="mt-6 p-4 bg-neu-base rounded-neu">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Settings Summary
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Video Threshold:</span>{' '}
            <span className="font-medium text-text-primary">{settings.videoCompletionThreshold}%</span>
          </div>
          <div>
            <span className="text-text-muted">Sequential Lock:</span>{' '}
            <span className={`font-medium ${settings.sequentialLock ? 'text-green-600' : 'text-text-secondary'}`}>
              {settings.sequentialLock ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Drip Content:</span>{' '}
            <span className={`font-medium ${settings.dripContent ? 'text-green-600' : 'text-text-secondary'}`}>
              {settings.dripContent ? `${settings.dripIntervalDays} days` : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Expiration:</span>{' '}
            <span className={`font-medium ${settings.expirationDays ? 'text-amber-600' : 'text-text-secondary'}`}>
              {settings.expirationDays ? `${settings.expirationDays} days` : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Certificates:</span>{' '}
            <span className={`font-medium ${settings.certificateEnabled ? 'text-green-600' : 'text-text-secondary'}`}>
              {settings.certificateEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
