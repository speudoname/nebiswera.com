'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
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
import { EndScreenConfigForm } from './EndScreenConfigForm'
import {
  BasicInfoTab,
  VideoTab,
  LandingPageTab,
  ScheduleTab,
  NotificationsTab,
} from './tabs'
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
  videoStatus?: string
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

type TabId =
  | 'basic'
  | 'video'
  | 'schedule'
  | 'landingPage'
  | 'endScreen'
  | 'interactions'
  | 'chat'
  | 'notifications'

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
    tabFromUrl && tabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'basic'
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
          <VideoTab
            data={data}
            onChange={handleChange}
            webinarId={webinarId}
            onSave={handleSave}
          />
        )}
        {activeTab === 'schedule' && webinarId && (
          <ScheduleTab webinarId={webinarId} webinarTimezone={data.timezone} />
        )}
        {activeTab === 'landingPage' && webinarId && <LandingPageTab webinarId={webinarId} />}
        {activeTab === 'endScreen' && webinarId && <EndScreenConfigForm webinarId={webinarId} />}
        {activeTab === 'interactions' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            <Link
              href={`/admin/webinars/${webinarId}/interactions`}
              className="text-primary-600 hover:underline"
            >
              Manage Interactions →
            </Link>
            <br />
            <span className="text-sm mt-2 block">
              Add polls, CTAs, downloads, and Q&A prompts at specific timestamps.
            </span>
          </div>
        )}
        {activeTab === 'chat' && webinarId && (
          <div className="text-center py-12 text-text-muted">
            Chat management coming soon...
            <br />
            <span className="text-sm">
              Add simulated chat messages and configure moderation settings.
            </span>
          </div>
        )}
        {activeTab === 'notifications' && webinarId && (
          <NotificationsTab
            webinarId={webinarId}
            webinarTitle={data.title}
            webinarLanguage={data.language}
          />
        )}
      </div>
    </div>
  )
}
