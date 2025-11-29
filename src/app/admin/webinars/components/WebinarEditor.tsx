'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card } from '@/components/ui'
import {
  ArrowLeft,
  Save,
  Loader2,
  Info,
  Video,
  Calendar,
  MessageSquare,
  Bell,
  BarChart3,
  Users,
  User,
} from 'lucide-react'
import { VideoUploader } from './VideoUploader'
import { ScheduleConfigForm } from './ScheduleConfigForm'
import { RegistrationFieldsForm } from './RegistrationFieldsForm'
import type { RegistrationFieldConfig } from '@/types/registration-fields'

interface WebinarEditorProps {
  webinarId?: string
  initialData?: WebinarData
}

interface WebinarData {
  id?: string
  title: string
  slug: string
  description: string
  presenterName: string
  presenterTitle: string
  presenterBio: string
  presenterAvatar: string
  customThankYouPageHtml: string
  timezone: string
  completionPercent: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  hlsUrl?: string
  videoDuration?: number
  thumbnailUrl?: string
  videoStatus?: string // 'processing' | 'ready' | 'failed'
  landingPagePath?: string
  thankYouPagePath?: string
}

const defaultData: WebinarData = {
  title: '',
  slug: '',
  description: '',
  presenterName: '',
  presenterTitle: '',
  presenterBio: '',
  presenterAvatar: '',
  customThankYouPageHtml: '',
  timezone: 'Asia/Tbilisi',
  completionPercent: 80,
  status: 'DRAFT',
}

type TabId = 'basic' | 'video' | 'schedule' | 'regFields' | 'interactions' | 'chat' | 'notifications' | 'registrations' | 'analytics'

const tabs: { id: TabId; label: string; icon: React.ElementType; requiresId?: boolean }[] = [
  { id: 'basic', label: 'Basic Info', icon: Info },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'schedule', label: 'Schedule', icon: Calendar, requiresId: true },
  { id: 'regFields', label: 'Registration Fields', icon: User, requiresId: true },
  { id: 'interactions', label: 'Interactions', icon: MessageSquare, requiresId: true },
  { id: 'chat', label: 'Chat', icon: MessageSquare, requiresId: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, requiresId: true },
  { id: 'registrations', label: 'Registrations', icon: Users, requiresId: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, requiresId: true },
]

// Georgian to Latin transliteration map
const georgianToLatin: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
  'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
}

// Helper function to generate slug from title (converts Georgian to Latin)
function generateSlug(title: string): string {
  // First transliterate Georgian characters to Latin
  let transliterated = ''
  for (const char of title.toLowerCase()) {
    transliterated += georgianToLatin[char] || char
  }

  return transliterated
    .replace(/[^a-z0-9]+/g, '-') // Only keep Latin alphanumeric
    .replace(/^-|-$/g, '')
    .substring(0, 60) // Limit length
}

export function WebinarEditor({ webinarId, initialData }: WebinarEditorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get initial tab from URL or default to 'basic'
  const tabFromUrl = searchParams?.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(
    tabFromUrl && tabs.some(t => t.id === tabFromUrl) ? tabFromUrl : 'basic'
  )
  const [data, setData] = useState<WebinarData>(initialData || defaultData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  // Track if user has manually edited these fields
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(
    new Set(initialData?.slug ? ['slug'] : [])
  )

  const isNew = !webinarId

  // Sync URL with tab state
  useEffect(() => {
    if (!searchParams || !pathname) return
    const currentTab = searchParams.get('tab')
    if (currentTab !== activeTab) {
      const params = new URLSearchParams(searchParams.toString())
      if (activeTab === 'basic') {
        params.delete('tab')
      } else {
        params.set('tab', activeTab)
      }
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [activeTab, pathname, router, searchParams])

  const handleChange = (field: keyof WebinarData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)

    // Auto-generate slug and page paths from title (unless manually edited)
    if (field === 'title') {
      const slug = generateSlug(value.toString())

      // Auto-update slug if not manually edited
      if (!manuallyEditedFields.has('slug')) {
        setData((prev) => ({ ...prev, slug }))
      }

      // Auto-update landing page path if not manually edited
      if (!manuallyEditedFields.has('landingPagePath')) {
        const slugToUse = manuallyEditedFields.has('slug') ? data.slug : slug
        setData((prev) => ({ ...prev, landingPagePath: `/ka/webinar/${slugToUse}` }))
      }

      // Auto-update thank you page path if not manually edited
      if (!manuallyEditedFields.has('thankYouPagePath')) {
        const slugToUse = manuallyEditedFields.has('slug') ? data.slug : slug
        setData((prev) => ({ ...prev, thankYouPagePath: `/ka/webinar/${slugToUse}/thank-you` }))
      }
    }

    // When slug changes, also update page paths if they haven't been manually edited
    if (field === 'slug') {
      setManuallyEditedFields((prev) => new Set(prev).add('slug'))
      const slugValue = value.toString()

      if (!manuallyEditedFields.has('landingPagePath')) {
        setData((prev) => ({ ...prev, landingPagePath: `/ka/webinar/${slugValue}` }))
      }
      if (!manuallyEditedFields.has('thankYouPagePath')) {
        setData((prev) => ({ ...prev, thankYouPagePath: `/ka/webinar/${slugValue}/thank-you` }))
      }
    }

    // Mark field as manually edited
    if (field === 'landingPagePath' || field === 'thankYouPagePath') {
      setManuallyEditedFields((prev) => new Set(prev).add(field))
    }
  }

  const handleSave = async () => {
    if (!data.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const url = isNew ? '/api/admin/webinars' : `/api/admin/webinars/${webinarId}`
      const method = isNew ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save webinar')
      }

      const savedWebinar = await res.json()

      if (isNew) {
        // Redirect to edit page after creation
        router.push(`/admin/webinars/${savedWebinar.id}`)
      } else {
        // Stay on page, show success
        setData({ ...data, ...savedWebinar })
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webinar')
    } finally {
      setSaving(false)
    }
  }

  // Handle tab switch with auto-save
  const handleTabSwitch = async (newTab: TabId) => {
    if (newTab === activeTab) return

    // Auto-save if there are unsaved changes and we're not creating a new webinar
    if (hasUnsavedChanges && !isNew && data.title.trim()) {
      setSaving(true)
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (res.ok) {
          const savedWebinar = await res.json()
          setData({ ...data, ...savedWebinar })
          setHasUnsavedChanges(false)
        }
      } catch (err) {
        console.error('Auto-save failed:', err)
      } finally {
        setSaving(false)
      }
    }

    setActiveTab(newTab)
  }

  const handlePublish = async () => {
    if (!webinarId) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to publish webinar')
      }

      const savedWebinar = await res.json()
      setData({ ...data, ...savedWebinar })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish webinar')
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!webinarId) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to unpublish webinar')
      }

      const savedWebinar = await res.json()
      setData({ ...data, ...savedWebinar })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish webinar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/webinars"
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Webinars
        </Link>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && !isNew && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          )}
          {!isNew && data.status === 'DRAFT' && (
            <Button variant="secondary" onClick={handlePublish} disabled={saving}>
              Publish
            </Button>
          )}
          {!isNew && data.status === 'PUBLISHED' && (
            <Button variant="secondary" onClick={handleUnpublish} disabled={saving}>
              Unpublish
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isNew ? 'Create Webinar' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-neu text-red-700">
          {error}
        </div>
      )}

      {/* Status badge */}
      {!isNew && (
        <div className="mb-6">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-700'
                : data.status === 'ARCHIVED'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {data.status}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neu-dark mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isDisabled = tab.requiresId && isNew

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && handleTabSwitch(tab.id)}
                disabled={isDisabled}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : isDisabled
                    ? 'border-transparent text-text-muted/50 cursor-not-allowed'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'basic' && (
          <BasicInfoTab data={data} onChange={handleChange} />
        )}
        {activeTab === 'video' && (
          <VideoTab data={data} onChange={handleChange} webinarId={webinarId} onSave={handleSave} />
        )}
        {activeTab === 'schedule' && webinarId && (
          <ScheduleTab webinarId={webinarId} webinarTimezone={data.timezone} />
        )}
        {activeTab === 'regFields' && webinarId && (
          <RegistrationFieldsTab webinarId={webinarId} />
        )}
        {activeTab === 'interactions' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            <Link href={`/admin/webinars/${webinarId}/interactions`} className="text-primary-600 hover:underline">
              Manage Interactions →
            </Link>
            <br />
            <span className="text-sm mt-2 block">Add polls, CTAs, downloads, and Q&A prompts at specific timestamps.</span>
          </div>
        )}
        {activeTab === 'chat' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            Chat management coming soon...
            <br />
            <span className="text-sm">Add simulated chat messages and configure moderation settings.</span>
          </div>
        )}
        {activeTab === 'notifications' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            <Link href={`/admin/webinars/${webinarId}/notifications`} className="text-primary-600 hover:underline">
              Manage Notifications →
            </Link>
            <br />
            <span className="text-sm mt-2 block">Set up confirmation, reminder, and follow-up emails.</span>
          </div>
        )}
        {activeTab === 'registrations' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            <Link href={`/admin/webinars/${webinarId}/registrations`} className="text-primary-600 hover:underline">
              View Registrations →
            </Link>
          </div>
        )}
        {activeTab === 'analytics' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            <Link href={`/admin/webinars/${webinarId}/analytics`} className="text-primary-600 hover:underline">
              View Analytics →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Basic Info Tab Component
function BasicInfoTab({
  data,
  onChange,
}: {
  data: WebinarData
  onChange: (field: keyof WebinarData, value: string | number) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column - Main info */}
      <div className="space-y-6">
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Webinar Details</h3>

          <div className="space-y-4">
            <Input
              label="Title"
              value={data.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="e.g., Master AI Tools in 60 Minutes"
              required
            />

            <div>
              <Input
                label="URL Slug"
                value={data.slug}
                onChange={(e) => onChange('slug', e.target.value)}
                placeholder="e.g., master-ai-tools"
              />
              <p className="text-xs text-text-muted mt-1">
                Auto-generated from title • Used in URL: <code className="bg-neu-dark px-1 rounded">/webinar/{data.slug || 'your-slug'}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Description
              </label>
              <textarea
                value={data.description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="What will attendees learn in this webinar?"
                rows={4}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Timezone
                </label>
                <select
                  value={data.timezone}
                  onChange={(e) => onChange('timezone', e.target.value)}
                  className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="Asia/Tbilisi">Tbilisi (GMT+4)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Europe/Paris">Paris (GMT+1)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                </select>
              </div>

              <div>
                <Input
                  label="Completion %"
                  type="number"
                  min={50}
                  max={100}
                  value={data.completionPercent}
                  onChange={(e) => onChange('completionPercent', parseInt(e.target.value))}
                />
                <p className="text-xs text-text-muted mt-1">Watch % to count as completed</p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Page Paths</h3>
          <p className="text-sm text-text-muted mb-4">
            Auto-generated based on slug. These are the URLs where you'll build the landing and thank you pages.
          </p>

          <div className="space-y-4">
            <div>
              <Input
                label="Landing Page Path"
                value={data.landingPagePath || ''}
                onChange={(e) => onChange('landingPagePath', e.target.value)}
                placeholder="e.g., /ka/webinar/master-ai-tools"
              />
              <p className="text-xs text-text-muted mt-1">Auto-synced with slug</p>
            </div>

            <div>
              <Input
                label="Thank You Page Path"
                value={data.thankYouPagePath || ''}
                onChange={(e) => onChange('thankYouPagePath', e.target.value)}
                placeholder="e.g., /ka/webinar/master-ai-tools/thank-you"
              />
              <p className="text-xs text-text-muted mt-1">Auto-synced with slug</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Right column - Presenter */}
      <div>
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Presenter</h3>

          <div className="space-y-4">
            <Input
              label="Name"
              value={data.presenterName}
              onChange={(e) => onChange('presenterName', e.target.value)}
              placeholder="e.g., John Smith"
            />

            <Input
              label="Title / Role"
              value={data.presenterTitle}
              onChange={(e) => onChange('presenterTitle', e.target.value)}
              placeholder="e.g., CEO at TechCorp"
            />

            <Input
              label="Avatar URL"
              value={data.presenterAvatar}
              onChange={(e) => onChange('presenterAvatar', e.target.value)}
              placeholder="https://..."
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Bio
              </label>
              <textarea
                value={data.presenterBio}
                onChange={(e) => onChange('presenterBio', e.target.value)}
                placeholder="Brief presenter biography..."
                rows={4}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
              />
            </div>

            {/* Custom Thank You Page HTML */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Custom Thank You Page HTML
                <span className="text-xs text-text-muted ml-2">(Optional - shown below standard message)</span>
              </label>
              <textarea
                value={data.customThankYouPageHtml}
                onChange={(e) => onChange('customThankYouPageHtml', e.target.value)}
                placeholder="<div>Custom HTML content for thank you page...</div>"
                rows={6}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none font-mono"
              />
              <p className="text-xs text-text-muted mt-1">
                This HTML will be displayed below the standard thank you message after registration.
              </p>
            </div>

            {/* Presenter preview */}
            {data.presenterName && (
              <div className="mt-4 p-4 bg-neu-base rounded-neu">
                <p className="text-xs text-text-muted mb-2">Preview:</p>
                <div className="flex items-center gap-3">
                  {data.presenterAvatar ? (
                    <img
                      src={data.presenterAvatar}
                      alt={data.presenterName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {data.presenterName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-text-primary">{data.presenterName}</div>
                    {data.presenterTitle && (
                      <div className="text-sm text-text-muted">{data.presenterTitle}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// Video Tab Component
function VideoTab({
  data,
  onChange,
  webinarId,
  onSave,
}: {
  data: WebinarData
  onChange: (field: keyof WebinarData, value: string | number) => void
  webinarId?: string
  onSave: () => Promise<void>
}) {
  const handleUploadComplete = async (videoData: {
    bunnyVideoId: string
    duration: number
    thumbnail: string
    hlsUrl: string
  }) => {
    onChange('hlsUrl', videoData.hlsUrl)
    onChange('videoDuration', videoData.duration)
    onChange('thumbnailUrl', videoData.thumbnail)
    onChange('videoStatus', 'ready')

    // Auto-save after video upload
    await onSave()
  }

  const hasVideo = !!data.hlsUrl
  const isProcessing = data.videoStatus === 'processing'

  return (
    <Card variant="raised" padding="lg">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Webinar Video</h3>

      {/* Video status badge */}
      {data.videoStatus && (
        <div className="mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.videoStatus === 'ready'
                ? 'bg-green-100 text-green-700'
                : data.videoStatus === 'processing'
                ? 'bg-yellow-100 text-yellow-700'
                : data.videoStatus === 'failed'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {data.videoStatus === 'ready' && 'Video Ready'}
            {data.videoStatus === 'processing' && 'Processing...'}
            {data.videoStatus === 'failed' && 'Processing Failed'}
          </span>
        </div>
      )}

      {hasVideo && !isProcessing ? (
        <div className="space-y-4">
          {/* Video preview */}
          <div className="aspect-video bg-black rounded-neu overflow-hidden relative">
            <video
              controls
              className="w-full h-full"
              poster={data.thumbnailUrl}
            >
              <source src={data.hlsUrl} type="application/x-mpegURL" />
              Your browser does not support HLS video playback.
            </video>
          </div>

          {/* Video info */}
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>HLS Stream</span>
            {data.videoDuration && data.videoDuration > 0 && (
              <span>
                Duration: {Math.floor(data.videoDuration / 60)}:{(data.videoDuration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Thumbnail preview */}
          {data.thumbnailUrl && (
            <div className="flex items-center gap-4">
              <img
                src={data.thumbnailUrl}
                alt="Thumbnail"
                className="w-32 h-18 rounded object-cover"
              />
              <span className="text-sm text-text-muted">Auto-generated thumbnail</span>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              onChange('hlsUrl', '')
              onChange('videoDuration', 0)
              onChange('thumbnailUrl', '')
              onChange('videoStatus', '')
            }}
          >
            Remove Video
          </Button>
        </div>
      ) : (
        <VideoUploader
          webinarId={webinarId}
          webinarTitle={data.title}
          onUploadComplete={handleUploadComplete}
          onError={(err) => console.error('Upload error:', err)}
        />
      )}

      <div className="mt-6 pt-6 border-t border-neu-dark">
        <h4 className="font-medium text-text-primary mb-4">Manual Video URL Entry</h4>
        <p className="text-sm text-text-muted mb-4">
          If you've already processed a video, you can enter the HLS URL directly.
        </p>

        <div className="space-y-4">
          <Input
            label="HLS URL (playlist.m3u8)"
            value={data.hlsUrl || ''}
            onChange={(e) => onChange('hlsUrl', e.target.value)}
            placeholder="e.g., https://vz-xxx.b-cdn.net/{videoId}/playlist.m3u8"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thumbnail URL"
              value={data.thumbnailUrl || ''}
              onChange={(e) => onChange('thumbnailUrl', e.target.value)}
              placeholder="e.g., https://vz-xxx.b-cdn.net/{videoId}/thumbnail.jpg"
            />

            <Input
              label="Duration (seconds)"
              type="number"
              value={data.videoDuration || ''}
              onChange={(e) => onChange('videoDuration', parseInt(e.target.value) || 0)}
              placeholder="e.g., 3600"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

// Schedule Tab Component
function ScheduleTab({
  webinarId,
  webinarTimezone,
}: {
  webinarId: string
  webinarTimezone: string
}) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/schedule`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data.config)
        } else {
          throw new Error('Failed to fetch schedule')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [webinarId])

  const handleSave = async (scheduleConfig: any) => {
    const res = await fetch(`/api/admin/webinars/${webinarId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleConfig),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save schedule')
    }

    const data = await res.json()
    setConfig(data.config)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <ScheduleConfigForm
      webinarId={webinarId}
      webinarTimezone={webinarTimezone}
      initialConfig={config}
      onSave={handleSave}
    />
  )
}

// Registration Fields Tab Component
function RegistrationFieldsTab({ webinarId }: { webinarId: string }) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<RegistrationFieldConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/registration-fields`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data.config)
        } else if (res.status === 404) {
          // No config yet, use defaults
          setConfig(null)
        } else {
          throw new Error('Failed to fetch registration fields config')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load registration fields')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [webinarId])

  const handleSave = async (fieldConfig: RegistrationFieldConfig) => {
    const res = await fetch(`/api/admin/webinars/${webinarId}/registration-fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldConfig),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save registration fields')
    }

    const data = await res.json()
    setConfig(data.config)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <RegistrationFieldsForm
      webinarId={webinarId}
      initialConfig={config}
      onSave={handleSave}
    />
  )
}
