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
  CheckCircle2,
  Layout,
} from 'lucide-react'
import { ScheduleConfigForm } from './ScheduleConfigForm'
import { EndScreenConfigForm } from './EndScreenConfigForm'
import { NotificationsEditor } from './NotificationsEditor'
import { BasicInfoTab, VideoTab } from './tabs'
import { WebinarMediaPicker } from './WebinarMediaPicker'
import { TemplateSelector, type LandingPageTemplate } from './TemplateSelector'
import { RichTextEditor, type RichTextPart } from './RichTextEditor'
import { generateSimpleSlug } from '@/lib/utils/transliterate'

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
  language: 'ka' | 'en'
  completionPercent: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  hlsUrl?: string
  videoDuration?: number
  thumbnailUrl?: string
  videoStatus?: string // 'processing' | 'ready' | 'failed'
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
  language: 'ka',
  completionPercent: 80,
  status: 'DRAFT',
}

type TabId = 'basic' | 'video' | 'schedule' | 'landingPage' | 'endScreen' | 'interactions' | 'chat' | 'notifications'

const tabs: { id: TabId; label: string; icon: React.ElementType; requiresId?: boolean }[] = [
  { id: 'basic', label: 'Basic Info', icon: Info },
  { id: 'schedule', label: 'Schedule', icon: Calendar, requiresId: true },
  { id: 'landingPage', label: 'Landing Page', icon: Layout, requiresId: true },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'interactions', label: 'Interactions', icon: MessageSquare, requiresId: true },
  { id: 'chat', label: 'Chat', icon: MessageSquare, requiresId: true },
  { id: 'endScreen', label: 'End Screen', icon: CheckCircle2, requiresId: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, requiresId: true },
]

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

    // Auto-generate slug from title (unless manually edited)
    if (field === 'title') {
      const slug = generateSimpleSlug(value.toString(), 60)

      // Auto-update slug if not manually edited
      if (!manuallyEditedFields.has('slug')) {
        setData((prev) => ({ ...prev, slug }))
      }
    }

    // Mark slug as manually edited when user changes it directly
    if (field === 'slug') {
      setManuallyEditedFields((prev) => new Set(prev).add('slug'))
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
          <BasicInfoTab data={data} onChange={handleChange} webinarId={webinarId} />
        )}
        {activeTab === 'video' && (
          <VideoTab data={data} onChange={handleChange} webinarId={webinarId} onSave={handleSave} />
        )}
        {activeTab === 'schedule' && webinarId && (
          <ScheduleTab webinarId={webinarId} webinarTimezone={data.timezone} />
        )}
        {activeTab === 'landingPage' && webinarId && (
          <LandingPageTab webinarId={webinarId} />
        )}
        {activeTab === 'endScreen' && webinarId && (
          <EndScreenTab webinarId={webinarId} />
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
          <NotificationsTab webinarId={webinarId} webinarTitle={data.title} webinarLanguage={data.language} />
        )}
      </div>
    </div>
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

// End Screen Tab Component
function EndScreenTab({ webinarId }: { webinarId: string }) {
  return <EndScreenConfigForm webinarId={webinarId} />
}

// Notifications Tab Component
function NotificationsTab({
  webinarId,
  webinarTitle,
  webinarLanguage,
}: {
  webinarId: string
  webinarTitle: string
  webinarLanguage: 'ka' | 'en'
}) {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/notifications`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        } else {
          throw new Error('Failed to fetch notifications')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [webinarId])

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
    <NotificationsEditor
      webinarId={webinarId}
      webinarTitle={webinarTitle}
      webinarLanguage={webinarLanguage}
      initialNotifications={notifications}
    />
  )
}

// Landing Page Tab Component
function LandingPageTab({ webinarId }: { webinarId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<LandingPageConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/landing-page`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data.config || getDefaultConfig())
        } else if (res.status === 404) {
          setConfig(getDefaultConfig())
        } else {
          throw new Error('Failed to fetch landing page config')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load landing page config')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [webinarId])

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}/landing-page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save landing page config')
      }

      const data = await res.json()
      setConfig(data.config)
      setSuccessMessage('Landing page saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof LandingPageConfig, value: unknown) => {
    if (!config) return
    setConfig({ ...config, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error && !config) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-8">
      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-neu text-green-700">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-neu text-red-700">
          {error}
        </div>
      )}

      {/* Template Selection */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Template Layout</h3>
        <p className="text-sm text-text-muted mb-4">
          Choose how your landing page is structured. Each template has a unique design.
        </p>
        <TemplateSelector
          value={config.template}
          onChange={(template) => handleChange('template', template)}
          primaryColor={config.primaryColor}
        />
      </Card>

      {/* Header / Logo */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Header / Logo</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="logoType"
                checked={config.logoType === 'TEXT'}
                onChange={() => handleChange('logoType', 'TEXT')}
                className="accent-primary-500"
              />
              Text Logo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="logoType"
                checked={config.logoType === 'IMAGE'}
                onChange={() => handleChange('logoType', 'IMAGE')}
                className="accent-primary-500"
              />
              Image Logo
            </label>
          </div>
          {config.logoType === 'TEXT' ? (
            <Input
              label="Logo Text"
              value={config.logoText || ''}
              onChange={(e) => handleChange('logoText', e.target.value)}
              placeholder=":::...ნებისწერა...:::"
            />
          ) : (
            <Input
              label="Logo Image URL"
              value={config.logoImageUrl || ''}
              onChange={(e) => handleChange('logoImageUrl', e.target.value)}
              placeholder="https://..."
            />
          )}
        </div>
      </Card>

      {/* Section 1: Hero / Above the Fold */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Section 1: Above the Fold (Hero)</h3>
        <div className="space-y-4">
          {/* Hero Alignment Selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Text Alignment</label>
            <div className="flex gap-4">
              {(['LEFT', 'CENTER', 'RIGHT'] as ContentAlignment[]).map((alignment) => (
                <label key={alignment} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="heroAlignment"
                    checked={config.heroAlignment === alignment}
                    onChange={() => handleChange('heroAlignment', alignment)}
                    className="accent-primary-500"
                  />
                  {alignment === 'LEFT' && 'Left'}
                  {alignment === 'CENTER' && 'Center'}
                  {alignment === 'RIGHT' && 'Right'}
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Eyebrow"
            value={config.heroEyebrow || ''}
            onChange={(e) => handleChange('heroEyebrow', e.target.value)}
            placeholder="Small text above title"
          />

          {/* Rich Text Title */}
          <RichTextEditor
            label="Title (Rich Text)"
            value={config.heroTitleParts || null}
            plainValue={config.heroTitle || null}
            onChange={(parts) => handleChange('heroTitleParts', parts)}
            onPlainChange={(text) => handleChange('heroTitle', text)}
            placeholder="Main headline - use **bold**, *italic*, {{primary:colored}}"
            primaryColor={config.primaryColor}
          />

          {/* Rich Text Subtitle */}
          <RichTextEditor
            label="Subtitle (Rich Text)"
            value={config.heroSubtitleParts || null}
            plainValue={config.heroSubtitle || null}
            onChange={(parts) => handleChange('heroSubtitleParts', parts)}
            onPlainChange={(text) => handleChange('heroSubtitle', text)}
            placeholder="Secondary headline - use **bold**, *italic*, {{primary:colored}}"
            primaryColor={config.primaryColor}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Paragraph</label>
            <textarea
              value={config.heroParagraph || ''}
              onChange={(e) => handleChange('heroParagraph', e.target.value)}
              placeholder="Descriptive paragraph..."
              rows={4}
              className="w-full px-4 py-3 rounded-neu bg-white shadow-neu-inset border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Input
            label="Button Text"
            value={config.heroButtonText || ''}
            onChange={(e) => handleChange('heroButtonText', e.target.value)}
            placeholder="Register Now"
          />
          <Input
            label="Text Below Button"
            value={config.heroBelowButtonText || ''}
            onChange={(e) => handleChange('heroBelowButtonText', e.target.value)}
            placeholder="Limited spots available"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Button Style</label>
            <div className="flex gap-4 flex-wrap">
              {(['POPUP_FORM', 'INLINE_EMAIL', 'EXPAND_FORM'] as const).map((style) => (
                <label key={style} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="heroButtonStyle"
                    checked={config.heroButtonStyle === style}
                    onChange={() => handleChange('heroButtonStyle', style)}
                    className="accent-primary-500"
                  />
                  {style === 'POPUP_FORM' && 'Popup Form'}
                  {style === 'INLINE_EMAIL' && 'Inline Email'}
                  {style === 'EXPAND_FORM' && 'Expand Form'}
                </label>
              ))}
            </div>
          </div>
          {/* Hero Media Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Hero Media Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="heroMediaType"
                  checked={config.heroMediaType === 'IMAGE'}
                  onChange={() => handleChange('heroMediaType', 'IMAGE')}
                  className="accent-primary-500"
                />
                Image
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="heroMediaType"
                  checked={config.heroMediaType === 'VIDEO'}
                  onChange={() => handleChange('heroMediaType', 'VIDEO')}
                  className="accent-primary-500"
                />
                Video
              </label>
            </div>
          </div>

          {/* Hero Media Picker */}
          {config.heroMediaType === 'IMAGE' ? (
            <WebinarMediaPicker
              label="Hero Image"
              value={config.heroImageUrl || null}
              onChange={(url) => handleChange('heroImageUrl', url)}
              mediaType="images"
            />
          ) : (
            <WebinarMediaPicker
              label="Hero Video"
              value={config.heroVideoUrl || null}
              onChange={(url) => handleChange('heroVideoUrl', url)}
              mediaType="videos"
            />
          )}
        </div>
      </Card>

      {/* Section 2: Below the Fold */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Section 2: Below the Fold</h3>
        <div className="space-y-4">
          {/* Section 2 Layout Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Text Alignment</label>
              <div className="flex gap-3">
                {(['LEFT', 'CENTER', 'RIGHT'] as ContentAlignment[]).map((alignment) => (
                  <label key={alignment} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="section2Alignment"
                      checked={config.section2Alignment === alignment}
                      onChange={() => handleChange('section2Alignment', alignment)}
                      className="accent-primary-500"
                    />
                    {alignment === 'LEFT' && 'Left'}
                    {alignment === 'CENTER' && 'Center'}
                    {alignment === 'RIGHT' && 'Right'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Image Placement</label>
              <div className="flex gap-3">
                {(['LEFT', 'RIGHT', 'NONE'] as const).map((placement) => (
                  <label key={placement} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="section2ImagePlacement"
                      checked={config.section2ImagePlacement === placement}
                      onChange={() => handleChange('section2ImagePlacement', placement)}
                      className="accent-primary-500"
                    />
                    {placement === 'LEFT' && 'Left'}
                    {placement === 'RIGHT' && 'Right'}
                    {placement === 'NONE' && 'None'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Section Title"
            value={config.section2Title || ''}
            onChange={(e) => handleChange('section2Title', e.target.value)}
            placeholder="What you'll learn"
          />

          {/* List Items */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              List Items (3-9 items with headline, subheadline, paragraph)
            </label>
            <Section2ItemsEditor
              items={config.section2Items || []}
              onChange={(items) => handleChange('section2Items', items)}
            />
          </div>

          <Input
            label="CTA Text"
            value={config.section2CtaText || ''}
            onChange={(e) => handleChange('section2CtaText', e.target.value)}
            placeholder="Join us on..."
          />
          <Input
            label="Sub-CTA Text"
            value={config.section2SubCtaText || ''}
            onChange={(e) => handleChange('section2SubCtaText', e.target.value)}
            placeholder="December 15, 2024 at 6:00 PM"
          />
          <Input
            label="Button Text"
            value={config.section2ButtonText || ''}
            onChange={(e) => handleChange('section2ButtonText', e.target.value)}
            placeholder="Reserve Your Spot"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Button Style</label>
            <div className="flex gap-4 flex-wrap">
              {(['POPUP_FORM', 'INLINE_EMAIL', 'EXPAND_FORM'] as const).map((style) => (
                <label key={style} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="section2ButtonStyle"
                    checked={config.section2ButtonStyle === style}
                    onChange={() => handleChange('section2ButtonStyle', style)}
                    className="accent-primary-500"
                  />
                  {style === 'POPUP_FORM' && 'Popup Form'}
                  {style === 'INLINE_EMAIL' && 'Inline Email'}
                  {style === 'EXPAND_FORM' && 'Expand Form'}
                </label>
              ))}
            </div>
          </div>
          <WebinarMediaPicker
            label="Presenter Image"
            value={config.presenterImageUrl || null}
            onChange={(url) => handleChange('presenterImageUrl', url)}
            mediaType="images"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Presenter Image Shape</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="presenterImageShape"
                  checked={config.presenterImageShape === 'CIRCLE'}
                  onChange={() => handleChange('presenterImageShape', 'CIRCLE')}
                  className="accent-primary-500"
                />
                Circle
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="presenterImageShape"
                  checked={config.presenterImageShape === 'SQUARE'}
                  onChange={() => handleChange('presenterImageShape', 'SQUARE')}
                  className="accent-primary-500"
                />
                Square
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Footer</h3>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Disclaimer Text</label>
          <textarea
            value={config.footerDisclaimerText || ''}
            onChange={(e) => handleChange('footerDisclaimerText', e.target.value)}
            placeholder="Legal disclaimer or copyright notice..."
            rows={3}
            className="w-full px-4 py-3 rounded-neu bg-white shadow-neu-inset border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Landing Page
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Section 2 Items Editor Component
interface Section2Item {
  headline: string
  subheadline: string
  paragraph: string
}

function Section2ItemsEditor({
  items,
  onChange,
}: {
  items: Section2Item[]
  onChange: (items: Section2Item[]) => void
}) {
  const addItem = () => {
    if (items.length >= 9) return
    onChange([...items, { headline: '', subheadline: '', paragraph: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 3) return
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Section2Item, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  // Ensure we have at least 3 items
  const displayItems = items.length < 3
    ? [...items, ...Array(3 - items.length).fill({ headline: '', subheadline: '', paragraph: '' })]
    : items

  return (
    <div className="space-y-4">
      {displayItems.map((item, index) => (
        <div key={index} className="p-4 bg-neu-base rounded-neu space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-muted">Item {index + 1}</span>
            {items.length > 3 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <Input
            label="Headline"
            value={item.headline}
            onChange={(e) => updateItem(index, 'headline', e.target.value)}
            placeholder="Main point"
          />
          <Input
            label="Subheadline"
            value={item.subheadline}
            onChange={(e) => updateItem(index, 'subheadline', e.target.value)}
            placeholder="Supporting text"
          />
          <textarea
            value={item.paragraph}
            onChange={(e) => updateItem(index, 'paragraph', e.target.value)}
            placeholder="Detailed description..."
            rows={2}
            className="w-full px-4 py-3 rounded-neu bg-white shadow-neu-inset border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      ))}
      {items.length < 9 && (
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 text-primary-600 hover:text-primary-800 font-medium text-sm border-2 border-dashed border-gray-300 rounded-neu hover:border-primary-400 transition-colors"
        >
          + Add Item
        </button>
      )}
    </div>
  )
}

// Content Alignment type
type ContentAlignment = 'LEFT' | 'CENTER' | 'RIGHT'

// Landing Page Config Interface
interface LandingPageConfig {
  template: LandingPageTemplate
  logoType: 'TEXT' | 'IMAGE'
  logoText?: string
  logoImageUrl?: string
  heroEyebrow?: string
  heroTitle?: string
  heroTitleParts?: RichTextPart[] | null  // Rich text parts for styled title
  heroSubtitle?: string
  heroSubtitleParts?: RichTextPart[] | null  // Rich text parts for styled subtitle
  heroParagraph?: string
  heroButtonText?: string
  heroBelowButtonText?: string
  heroButtonStyle: 'POPUP_FORM' | 'INLINE_EMAIL' | 'EXPAND_FORM'
  heroMediaType: 'IMAGE' | 'VIDEO'
  heroImageUrl?: string
  heroVideoUrl?: string
  heroImagePlacement: 'LEFT' | 'RIGHT' | 'BACKGROUND' | 'NONE'
  heroAlignment: ContentAlignment  // Text alignment in hero section
  section2Title?: string
  section2Items: Section2Item[]
  section2CtaText?: string
  section2SubCtaText?: string
  section2ButtonText?: string
  section2ButtonStyle: 'POPUP_FORM' | 'INLINE_EMAIL' | 'EXPAND_FORM'
  section2ImagePlacement: 'LEFT' | 'RIGHT' | 'BACKGROUND' | 'NONE'  // Independent section 2 layout
  section2Alignment: ContentAlignment  // Section 2 text alignment
  presenterImageUrl?: string
  presenterImageShape: 'CIRCLE' | 'SQUARE'
  footerDisclaimerText?: string
  primaryColor?: string
  backgroundColor?: string
}

function getDefaultConfig(): LandingPageConfig {
  return {
    template: 'IMAGE_RIGHT',
    logoType: 'TEXT',
    logoText: ':::...ნებისწერა...:::',
    heroButtonStyle: 'POPUP_FORM',
    heroMediaType: 'IMAGE',
    heroImagePlacement: 'RIGHT',
    heroAlignment: 'LEFT',
    heroTitleParts: null,
    heroSubtitleParts: null,
    section2Items: [
      { headline: '', subheadline: '', paragraph: '' },
      { headline: '', subheadline: '', paragraph: '' },
      { headline: '', subheadline: '', paragraph: '' },
    ],
    section2ButtonStyle: 'POPUP_FORM',
    section2ImagePlacement: 'RIGHT',
    section2Alignment: 'LEFT',
    presenterImageShape: 'CIRCLE',
  }
}
