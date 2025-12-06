'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Mail,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  MessageSquare,
  Tag,
  Sparkles,
  FileText,
  Loader2,
  Settings,
} from 'lucide-react'
import type { MailyEditorRef } from '@/app/admin/campaigns/components/MailyEditor'

// Dynamically import MailyEditor to avoid SSR issues
const MailyEditor = dynamic(
  () => import('@/app/admin/campaigns/components/MailyEditor').then((mod) => mod.MailyEditor),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" /> }
)

// Types
interface NotificationAction {
  type: 'TAG_CONTACT'
  tagId: string
  tagName?: string
}

export interface Notification {
  id: string
  templateKey: string | null  // If set, tracks which template it came from
  triggerType: string
  triggerMinutes: number
  triggerDescription?: string
  conditions: unknown
  channel: string
  // Content
  subject: string | null
  bodyHtml: string | null
  bodyText: string | null
  // Sender settings (optional overrides)
  fromName: string | null
  fromEmail: string | null
  replyTo: string | null
  // Actions
  actions: NotificationAction[] | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  stats?: {
    sent: number
    pending: number
  }
}

interface Tag {
  id: string
  name: string
  color: string
}

interface EmailSettings {
  emailFromName: string
  emailFromAddress: string
}

interface NotificationsEditorProps {
  webinarId: string
  webinarTitle: string
  webinarLanguage: 'ka' | 'en'
  initialNotifications: Notification[]
}

// Template key descriptions with their default config
interface TemplateInfo {
  name: string
  description: string
  triggerType: 'AFTER_REGISTRATION' | 'BEFORE_START' | 'AFTER_END'
  triggerMinutes: number
  conditions: Record<string, unknown> | null
}

const TEMPLATE_CONFIGS: Record<string, TemplateInfo> = {
  'registration-confirmation': {
    name: 'Registration Confirmation',
    description: 'Sent immediately when someone registers for the webinar',
    triggerType: 'AFTER_REGISTRATION',
    triggerMinutes: 0,
    conditions: null,
  },
  'reminder-24h': {
    name: '24-Hour Reminder',
    description: 'Sent 24 hours before the session starts',
    triggerType: 'BEFORE_START',
    triggerMinutes: 1440,
    conditions: null,
  },
  'reminder-1h': {
    name: '1-Hour Reminder',
    description: 'Sent 1 hour before the session starts',
    triggerType: 'BEFORE_START',
    triggerMinutes: 60,
    conditions: null,
  },
  'reminder-15m': {
    name: '15-Minute Reminder',
    description: 'Sent 15 minutes before the session starts',
    triggerType: 'BEFORE_START',
    triggerMinutes: 15,
    conditions: null,
  },
  'followup-missed': {
    name: 'Missed Webinar Follow-up',
    description: 'Sent to registrants who did not attend',
    triggerType: 'AFTER_END',
    triggerMinutes: 15,
    conditions: { attended: false },
  },
  'followup-partial': {
    name: 'Partial Watch Follow-up',
    description: 'Sent to attendees who watched less than 50%',
    triggerType: 'AFTER_END',
    triggerMinutes: 15,
    conditions: { AND: [{ attended: true }, { watchedPercent: { lt: 50 } }] },
  },
  'followup-completed': {
    name: 'Completion Follow-up',
    description: 'Sent to attendees who watched 80% or more',
    triggerType: 'AFTER_END',
    triggerMinutes: 15,
    conditions: { watchedPercent: { gte: 80 } },
  },
}

// For backwards compatibility - used by the notification list display
const TEMPLATE_DESCRIPTIONS = Object.fromEntries(
  Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => [
    key,
    { name: config.name, description: config.description }
  ])
) as Record<string, { name: string; description: string }>

// Timing options for different trigger types
const TIMING_OPTIONS = {
  AFTER_REGISTRATION: [
    { label: 'Immediately', value: 0 },
    { label: '15 minutes after', value: 15 },
    { label: '30 minutes after', value: 30 },
    { label: '1 hour after', value: 60 },
    { label: '3 hours after', value: 180 },
    { label: '6 hours after', value: 360 },
    { label: '12 hours after', value: 720 },
    { label: '24 hours after', value: 1440 },
  ],
  BEFORE_START: [
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '3 hours before', value: 180 },
    { label: '6 hours before', value: 360 },
    { label: '12 hours before', value: 720 },
    { label: '24 hours before', value: 1440 },
    { label: '48 hours before', value: 2880 },
    { label: '72 hours before', value: 4320 },
  ],
  AFTER_END: [
    { label: 'Immediately', value: 0 },
    { label: '15 minutes after', value: 15 },
    { label: '30 minutes after', value: 30 },
    { label: '1 hour after', value: 60 },
    { label: '3 hours after', value: 180 },
    { label: '6 hours after', value: 360 },
    { label: '12 hours after', value: 720 },
    { label: '24 hours after', value: 1440 },
    { label: '48 hours after', value: 2880 },
  ],
}

// Conditions for follow-up emails
const FOLLOW_UP_CONDITIONS = [
  { label: 'Everyone (all registrants)', value: null },
  { label: 'Attended the webinar', value: { attended: true } },
  { label: 'Did not attend (no-shows)', value: { attended: false } },
  { label: 'Watched to completion', value: { completed: true } },
  { label: 'Left early (did not complete)', value: { and: [{ attended: true }, { completed: false }] } },
]

// Template variables reference
const TEMPLATE_VARIABLES = [
  { key: '{{first_name}}', desc: 'Contact first name' },
  { key: '{{email}}', desc: 'Contact email' },
  { key: '{{webinar_title}}', desc: 'Webinar title' },
  { key: '{{session_date}}', desc: 'Session date/time' },
  { key: '{{watch_url}}', desc: 'Watch URL' },
  { key: '{{replay_url}}', desc: 'Replay URL' },
]

function getNotificationCategoryColor(triggerType: string): string {
  switch (triggerType) {
    case 'AFTER_REGISTRATION':
      return 'text-green-500'
    case 'BEFORE_START':
      return 'text-blue-500'
    case 'AFTER_END':
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}

function getNotificationIcon(triggerType: string) {
  switch (triggerType) {
    case 'AFTER_REGISTRATION':
      return CheckCircle
    case 'BEFORE_START':
      return Bell
    case 'AFTER_END':
      return Mail
    default:
      return Mail
  }
}

export function NotificationsEditor({
  webinarId,
  webinarTitle,
  webinarLanguage,
  initialNotifications,
}: NotificationsEditorProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)

  // Fetch available tags and email settings
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tags
        const tagsRes = await fetch('/api/admin/contacts/tags')
        if (tagsRes.ok) {
          const data = await tagsRes.json()
          setAvailableTags(data.tags || [])
        }

        // Fetch email settings for from/reply-to defaults
        const settingsRes = await fetch('/api/admin/settings')
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          // API returns settings directly (not nested under 'settings')
          setEmailSettings({
            emailFromName: data.emailFromName || 'Nebiswera',
            emailFromAddress: data.emailFromAddress || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  const handleAddNotification = async (newNotification: Partial<Notification>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/webinars/${webinarId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification),
      })

      if (!response.ok) throw new Error('Failed to create notification')

      const data = await response.json()
      setNotifications([...notifications, data.notification])
      setShowAddModal(false)
      setSaveMessage('Notification added!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to create notification')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateNotification = async (notification: Notification) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/notifications/${notification.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification),
        }
      )

      if (!response.ok) throw new Error('Failed to update notification')

      const data = await response.json()
      setNotifications(
        notifications.map((n) => (n.id === notification.id ? data.notification : n))
      )
      setEditingId(null)
      setSaveMessage('Notification updated!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to update notification')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/notifications/${id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete notification')

      setNotifications(notifications.filter((n) => n.id !== id))
      setSaveMessage('Notification deleted!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to delete notification')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (notification: Notification) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/notifications/${notification.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !notification.isActive }),
        }
      )

      if (!response.ok) throw new Error('Failed to toggle notification')

      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, isActive: !n.isActive } : n
        )
      )
    } catch (error) {
      console.error(error)
      alert('Failed to toggle notification')
    } finally {
      setIsSaving(false)
    }
  }

  // Group notifications by trigger type
  const groupedNotifications = {
    AFTER_REGISTRATION: notifications.filter((n) => n.triggerType === 'AFTER_REGISTRATION'),
    BEFORE_START: notifications.filter((n) => n.triggerType === 'BEFORE_START'),
    AFTER_END: notifications.filter((n) => n.triggerType === 'AFTER_END'),
  }

  return (
    <div className="space-y-6">
      {/* Save message */}
      {saveMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
          {saveMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Email Notifications</h2>
          <p className="text-sm text-text-secondary">
            Automated emails sent to registrants. Templates automatically send in the user&apos;s preferred language.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Notification
        </Button>
      </div>

      {/* Info about templates */}
      <Card variant="raised" padding="sm">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">
              <strong>Templates:</strong> When adding a notification from a template, the content is loaded
              in the webinar&apos;s language and saved as editable content. You can customize all emails
              after adding them. Use variables like <code className="bg-gray-100 px-1 rounded">{`{{first_name}}`}</code> for personalization.
            </p>
          </div>
        </div>
      </Card>

      {/* Notification groups */}
      {Object.entries(groupedNotifications).map(([triggerType, groupNotifications]) => {
        const Icon = getNotificationIcon(triggerType)
        const color = getNotificationCategoryColor(triggerType)
        const categoryLabels: Record<string, string> = {
          AFTER_REGISTRATION: 'Registration Confirmations',
          BEFORE_START: 'Session Reminders',
          AFTER_END: 'Follow-up Emails',
        }

        return (
          <div key={triggerType} className="space-y-3">
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${color}`}>
              <Icon className="w-4 h-4" />
              {categoryLabels[triggerType]}
              <span className="text-text-muted font-normal">({groupNotifications.length})</span>
            </h3>

            {groupNotifications.length === 0 ? (
              <Card variant="raised" padding="sm">
                <p className="text-sm text-text-secondary">No {categoryLabels[triggerType].toLowerCase()} configured.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {groupNotifications.map((notification) => {
                  const isExpanded = expandedId === notification.id
                  const isEditing = editingId === notification.id
                  const templateInfo = notification.templateKey
                    ? TEMPLATE_DESCRIPTIONS[notification.templateKey]
                    : null

                  return (
                    <Card
                      key={notification.id}
                      variant="raised"
                      padding="md"
                      className={!notification.isActive ? 'opacity-60' : ''}
                    >
                      {isEditing ? (
                        <CustomNotificationEditForm
                          notification={notification}
                          webinarTitle={webinarTitle}
                          availableTags={availableTags}
                          emailSettings={emailSettings}
                          onSave={handleUpdateNotification}
                          onCancel={() => setEditingId(null)}
                          isSaving={isSaving}
                        />
                      ) : (
                        <>
                          <div
                            className="flex items-start justify-between cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : notification.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Template-based notification */}
                                {templateInfo ? (
                                  <>
                                    <FileText className="w-4 h-4 text-primary-500" />
                                    <h4 className="font-medium text-text-primary">
                                      {templateInfo.name}
                                    </h4>
                                  </>
                                ) : (
                                  <h4 className="font-medium text-text-primary truncate">
                                    {notification.subject || 'Custom Email'}
                                  </h4>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded ${color.replace('text-', 'bg-').replace('500', '100')} ${color}`}>
                                  {notification.triggerDescription}
                                </span>
                                {!notification.isActive && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                                    <EyeOff className="w-3 h-3" />
                                    Disabled
                                  </span>
                                )}
                                {notification.actions && notification.actions.length > 0 && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {notification.actions.length} action(s)
                                  </span>
                                )}
                              </div>
                              {templateInfo && (
                                <p className="text-sm text-text-secondary mt-1">
                                  {templateInfo.description}
                                </p>
                              )}
                              {notification.stats && (
                                <p className="text-xs text-text-muted mt-1">
                                  {notification.stats.sent} sent, {notification.stats.pending} pending
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleActive(notification)
                                }}
                                className={`p-1.5 rounded transition-colors ${
                                  notification.isActive
                                    ? 'text-green-500 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={notification.isActive ? 'Disable' : 'Enable'}
                              >
                                {notification.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-text-secondary" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-text-secondary" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                              {/* Template-based notification info */}
                              {templateInfo && (
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <p className="text-sm text-blue-800">
                                    <FileText className="w-4 h-4 inline mr-1" />
                                    Based on template: <strong>{templateInfo.name}</strong>. Content has been
                                    customized and saved for this webinar.
                                  </p>
                                </div>
                              )}

                              {/* Custom notification content */}
                              {!templateInfo && notification.subject && (
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-text-secondary uppercase">Email Content</h5>
                                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    <div>
                                      <p className="text-xs text-text-muted">Subject</p>
                                      <p className="font-medium text-sm">{notification.subject}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-text-secondary uppercase">Actions</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {notification.actions.map((action, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs"
                                      >
                                        <Tag className="w-3 h-3" />
                                        Tag: {action.tagName || action.tagId}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex justify-end gap-2 pt-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingId(notification.id)
                                  }}
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteNotification(notification.id)
                                  }}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty state */}
      {notifications.length === 0 && (
        <Card variant="raised" padding="lg" className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-text-secondary">No notifications configured yet.</p>
          <p className="text-sm text-text-muted mt-1">
            Add notifications to engage with your registrants at key moments.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add First Notification
          </Button>
        </Card>
      )}

      {/* Add notification modal */}
      {showAddModal && (
        <AddNotificationModal
          webinarId={webinarId}
          webinarTitle={webinarTitle}
          webinarLanguage={webinarLanguage}
          availableTags={availableTags}
          emailSettings={emailSettings}
          existingTemplateKeys={notifications.filter(n => n.templateKey).map(n => n.templateKey!)}
          onAdd={handleAddNotification}
          onClose={() => setShowAddModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

// Add Notification Modal - with template selection
function AddNotificationModal({
  webinarId,
  webinarTitle,
  webinarLanguage,
  availableTags,
  emailSettings,
  existingTemplateKeys,
  onAdd,
  onClose,
  isSaving,
}: {
  webinarId: string
  webinarTitle: string
  webinarLanguage: 'ka' | 'en'
  availableTags: Tag[]
  emailSettings: EmailSettings | null
  existingTemplateKeys: string[]
  onAdd: (notification: Partial<Notification>) => void
  onClose: () => void
  isSaving: boolean
}) {
  const [step, setStep] = useState<'choose' | 'template' | 'type' | 'timing' | 'content'>('choose')
  const [triggerType, setTriggerType] = useState<string>('')
  const [triggerMinutes, setTriggerMinutes] = useState<number>(0)
  const [conditions, setConditions] = useState<unknown>(null)
  const [customMinutes, setCustomMinutes] = useState<number | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  // Template tracking
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null)
  const [cameFromTemplate, setCameFromTemplate] = useState(false)

  // Sender settings visibility toggle
  const [showSenderSettings, setShowSenderSettings] = useState(false)

  // Content state
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyDesign, setBodyDesign] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Email sender settings (optional overrides)
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')

  const editorRef = useRef<MailyEditorRef>(null)

  // Get available templates (not already added)
  const availableTemplates = Object.entries(TEMPLATE_CONFIGS).filter(
    ([key]) => !existingTemplateKeys.includes(key)
  )

  const handleSelectType = (type: string) => {
    setTriggerType(type)
    const defaultTiming = TIMING_OPTIONS[type as keyof typeof TIMING_OPTIONS]?.[0]?.value || 0
    setTriggerMinutes(defaultTiming)
    setStep('timing')
  }

  // Load template content and go to edit step
  const handleSelectTemplate = async (templateKey: string) => {
    const config = TEMPLATE_CONFIGS[templateKey]
    if (!config) return

    setLoadingTemplate(true)
    try {
      // Fetch template content in the webinar's language
      const res = await fetch(`/api/admin/webinars/templates/${templateKey}?language=${webinarLanguage}`)
      if (!res.ok) throw new Error('Failed to load template')

      const data = await res.json()

      // Set template data
      setSelectedTemplateKey(templateKey)
      setTriggerType(config.triggerType)
      setTriggerMinutes(config.triggerMinutes)
      setConditions(config.conditions)
      setSubject(data.subject || '')
      setBodyHtml(data.bodyHtml || '')
      setCameFromTemplate(true)

      // Go to content editing step
      setStep('content')
    } catch (error) {
      console.error('Failed to load template:', error)
      alert('Failed to load template content')
    } finally {
      setLoadingTemplate(false)
    }
  }

  const handleSave = async () => {
    let finalBodyHtml = bodyHtml
    let finalBodyDesign = bodyDesign

    if (editorRef.current) {
      try {
        const exported = await editorRef.current.exportHtml()
        finalBodyHtml = exported.html
        finalBodyDesign = exported.design
      } catch (e) {
        console.error('Failed to export editor content:', e)
      }
    }

    const actions: NotificationAction[] = selectedTags.map((tagId) => {
      const tag = availableTags.find((t) => t.id === tagId)
      return {
        type: 'TAG_CONTACT',
        tagId,
        tagName: tag?.name,
      }
    })

    onAdd({
      templateKey: selectedTemplateKey, // Track which template it came from (can be null for custom)
      triggerType,
      triggerMinutes: customMinutes ?? triggerMinutes,
      conditions,
      channel: 'EMAIL',
      subject,
      bodyHtml: finalBodyHtml || null,
      bodyText: null,
      // Email sender settings (only include if different from defaults)
      fromName: fromName || null,
      fromEmail: fromEmail || null,
      replyTo: replyTo || null,
      actions: actions.length > 0 ? actions : null,
      isActive: true,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Add Notification</h2>
            <p className="text-sm text-text-secondary">
              {step === 'choose' && 'Choose notification type'}
              {step === 'template' && 'Select a pre-built template'}
              {step === 'type' && 'Choose when to send'}
              {step === 'timing' && 'Set the timing'}
              {step === 'content' && 'Write your email (use variables for personalization)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 0: Choose between template or custom */}
          {step === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('template')}
                className="w-full flex items-start gap-4 p-4 rounded-lg border hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <FileText className="w-6 h-6 text-primary-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Use Pre-built Template</p>
                  <p className="text-sm text-text-secondary">
                    Choose from standard webinar emails (confirmation, reminders, follow-ups).
                    Template will be loaded in {webinarLanguage === 'ka' ? 'Georgian' : 'English'} and you can edit before saving.
                  </p>
                  {availableTemplates.length > 0 ? (
                    <p className="text-xs text-primary-500 mt-1">
                      {availableTemplates.length} template{availableTemplates.length !== 1 ? 's' : ''} available
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">
                      All templates already added
                    </p>
                  )}
                </div>
              </button>

              <button
                onClick={() => setStep('type')}
                className="w-full flex items-start gap-4 p-4 rounded-lg border hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <Edit2 className="w-6 h-6 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium">Create Custom Email</p>
                  <p className="text-sm text-text-secondary">
                    Write your own email with custom content.
                    Use variables like {`{{first_name}}`} for personalization.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Step 1a: Select template */}
          {step === 'template' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                &larr; Back
              </button>

              {availableTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-text-secondary">All templates have been added!</p>
                  <Button onClick={() => setStep('type')} className="mt-4">
                    Create Custom Email Instead
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-text-secondary">
                    Select a template to add:
                  </p>

                  {/* Group templates by trigger type */}
                  {(['AFTER_REGISTRATION', 'BEFORE_START', 'AFTER_END'] as const).map((triggerType) => {
                    const templatesForType = availableTemplates.filter(
                      ([, config]) => config.triggerType === triggerType
                    )
                    if (templatesForType.length === 0) return null

                    const Icon = getNotificationIcon(triggerType)
                    const color = getNotificationCategoryColor(triggerType)
                    const labels: Record<string, string> = {
                      AFTER_REGISTRATION: 'Registration',
                      BEFORE_START: 'Reminders',
                      AFTER_END: 'Follow-ups',
                    }

                    return (
                      <div key={triggerType}>
                        <h4 className={`text-sm font-semibold flex items-center gap-2 mb-2 ${color}`}>
                          <Icon className="w-4 h-4" />
                          {labels[triggerType]}
                        </h4>
                        <div className="space-y-2 ml-6">
                          {templatesForType.map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => handleSelectTemplate(key)}
                              disabled={isSaving || loadingTemplate}
                              className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary-500 hover:bg-primary-50 transition-all text-left disabled:opacity-50"
                            >
                              <div>
                                <p className="font-medium">{config.name}</p>
                                <p className="text-sm text-text-secondary">{config.description}</p>
                              </div>
                              {loadingTemplate ? (
                                <Loader2 className="w-5 h-5 text-primary-500 flex-shrink-0 animate-spin" />
                              ) : (
                                <Plus className="w-5 h-5 text-primary-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 1b: Select trigger type (for custom) */}
          {step === 'type' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                &larr; Back
              </button>

              {[
                {
                  type: 'AFTER_REGISTRATION',
                  label: 'After Registration',
                  description: 'Send immediately or some time after someone registers',
                  icon: CheckCircle,
                  color: 'text-green-500',
                },
                {
                  type: 'BEFORE_START',
                  label: 'Before Session',
                  description: 'Send reminders before the webinar starts',
                  icon: Bell,
                  color: 'text-blue-500',
                },
                {
                  type: 'AFTER_END',
                  label: 'After Session',
                  description: 'Follow up after the webinar ends (attended, missed, etc.)',
                  icon: Mail,
                  color: 'text-purple-500',
                },
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleSelectType(option.type)}
                  className="w-full flex items-start gap-4 p-4 rounded-lg border hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                >
                  <option.icon className={`w-6 h-6 ${option.color} mt-0.5`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-text-secondary">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Select timing */}
          {step === 'timing' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('type')}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                &larr; Back
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">When should this email be sent?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(TIMING_OPTIONS[triggerType as keyof typeof TIMING_OPTIONS] || []).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTriggerMinutes(option.value)
                        setCustomMinutes(null)
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        triggerMinutes === option.value && customMinutes === null
                          ? 'border-primary-500 bg-primary-50'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom timing */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium mb-2">Or set custom timing (minutes)</label>
                <Input
                  type="number"
                  value={customMinutes ?? ''}
                  onChange={(e) => setCustomMinutes(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 45"
                />
              </div>

              {/* Conditions for AFTER_END */}
              {triggerType === 'AFTER_END' && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">Who should receive this email?</label>
                  <div className="space-y-2">
                    {FOLLOW_UP_CONDITIONS.map((condition) => (
                      <button
                        key={condition.label}
                        onClick={() => setConditions(condition.value)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          JSON.stringify(conditions) === JSON.stringify(condition.value)
                            ? 'border-primary-500 bg-primary-50'
                            : 'hover:border-gray-300'
                        }`}
                      >
                        {condition.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={() => setStep('content')} className="w-full">
                  Continue to Email Content
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Email content */}
          {step === 'content' && (
            <div className="space-y-6">
              <button
                onClick={() => {
                  if (cameFromTemplate) {
                    // Go back to template selection
                    setCameFromTemplate(false)
                    setSelectedTemplateKey(null)
                    setSubject('')
                    setBodyHtml('')
                    setStep('template')
                  } else {
                    setStep('timing')
                  }
                }}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                &larr; Back
              </button>

              {/* Template info badge */}
              {selectedTemplateKey && (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Based on: <strong>{TEMPLATE_CONFIGS[selectedTemplateKey]?.name}</strong>
                    {' '}({webinarLanguage === 'ka' ? 'Georgian' : 'English'})
                  </p>
                </div>
              )}

              {/* Template variables reference */}
              <Card variant="raised" padding="sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Available template variables:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <code
                          key={v.key}
                          className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono"
                          title={v.desc}
                        >
                          {v.key}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sender Settings (collapsible) */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowSenderSettings(!showSenderSettings)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm font-medium">Sender Settings</span>
                    {(fromName || fromEmail || replyTo) && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        Customized
                      </span>
                    )}
                  </div>
                  {showSenderSettings ? (
                    <ChevronUp className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
                {showSenderSettings && (
                  <div className="p-4 space-y-4 border-t">
                    <p className="text-xs text-text-secondary">
                      Leave blank to use default settings from Admin Settings.
                      {emailSettings && (
                        <> Default: <strong>{emailSettings.emailFromName}</strong> &lt;{emailSettings.emailFromAddress}&gt;</>
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="From Name (optional)"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder={emailSettings?.emailFromName || 'Nebiswera'}
                      />
                      <Input
                        label="From Email (optional)"
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder={emailSettings?.emailFromAddress || 'noreply@nebiswera.com'}
                      />
                    </div>
                    <Input
                      label="Reply-To Email (optional)"
                      type="email"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="Same as From Email if not set"
                    />
                  </div>
                )}
              </div>

              {/* Email content */}
              <div className="space-y-4">
                <Input
                  label="Subject Line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`Your session "${webinarTitle}" starts soon!`}
                />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Body
                  </label>
                  <div className="border rounded-lg overflow-hidden">
                    <MailyEditor
                      ref={editorRef}
                      initialContent={bodyDesign || bodyHtml || undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Actions (tag contacts) */}
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Actions (when this email is sent)
                </h4>
                {availableTags.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No tags available. Create tags in the Contacts section first.
                  </p>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">Tag contact with:</label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag.id)
                                ? prev.filter((id) => id !== tag.id)
                                : [...prev, tag.id]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            selectedTags.includes(tag.id)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            borderColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                            backgroundColor: selectedTags.includes(tag.id) ? `${tag.color}20` : undefined,
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'content' && (
          <div className="flex justify-end gap-2 p-4 border-t flex-shrink-0">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={isSaving} disabled={!subject}>
              Add Notification
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Edit Notification Form (works for both custom and template-based notifications)
function CustomNotificationEditForm({
  notification,
  webinarTitle,
  availableTags,
  emailSettings,
  onSave,
  onCancel,
  isSaving,
}: {
  notification: Notification
  webinarTitle: string
  availableTags: Tag[]
  emailSettings: EmailSettings | null
  onSave: (notification: Notification) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [triggerMinutes, setTriggerMinutes] = useState(notification.triggerMinutes)
  const [conditions, setConditions] = useState(notification.conditions)
  const [subject, setSubject] = useState(notification.subject || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    notification.actions?.map((a) => a.tagId) || []
  )

  // Sender settings - initialize from notification or show placeholders from admin settings
  const [fromName, setFromName] = useState(notification.fromName || '')
  const [fromEmail, setFromEmail] = useState(notification.fromEmail || '')
  const [replyTo, setReplyTo] = useState(notification.replyTo || '')
  const [showSenderSettings, setShowSenderSettings] = useState(false)

  const editorRef = useRef<MailyEditorRef>(null)

  const handleSave = async () => {
    let finalBodyHtml = notification.bodyHtml
    let finalBodyDesign: string | undefined

    if (editorRef.current) {
      try {
        const exported = await editorRef.current.exportHtml()
        finalBodyHtml = exported.html
        finalBodyDesign = exported.design
      } catch (e) {
        console.error('Failed to export editor content:', e)
      }
    }

    const actions: NotificationAction[] = selectedTags.map((tagId) => {
      const tag = availableTags.find((t) => t.id === tagId)
      return {
        type: 'TAG_CONTACT',
        tagId,
        tagName: tag?.name,
      }
    })

    onSave({
      ...notification,
      triggerMinutes,
      conditions,
      subject,
      bodyHtml: finalBodyHtml,
      fromName: fromName || null,
      fromEmail: fromEmail || null,
      replyTo: replyTo || null,
      actions: actions.length > 0 ? actions : null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Template variables reference */}
      <Card variant="raised" padding="sm">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary mb-1">Available template variables:</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <code
                  key={v.key}
                  className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono"
                  title={v.desc}
                >
                  {v.key}
                </code>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Timing */}
      <div>
        <label className="block text-sm font-medium mb-2">Timing</label>
        <select
          value={triggerMinutes}
          onChange={(e) => setTriggerMinutes(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {(TIMING_OPTIONS[notification.triggerType as keyof typeof TIMING_OPTIONS] || []).map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* Conditions for AFTER_END */}
      {notification.triggerType === 'AFTER_END' && (
        <div>
          <label className="block text-sm font-medium mb-2">Recipients</label>
          <select
            value={JSON.stringify(conditions)}
            onChange={(e) => setConditions(e.target.value === 'null' ? null : JSON.parse(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {FOLLOW_UP_CONDITIONS.map((condition) => (
              <option key={condition.label} value={JSON.stringify(condition.value)}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Email content */}
      <div className="space-y-4">
        <Input
          label="Subject Line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Email Body
          </label>
          <div className="border rounded-lg overflow-hidden">
            <MailyEditor
              ref={editorRef}
              initialContent={notification.bodyHtml || undefined}
            />
          </div>
        </div>
      </div>

      {/* Sender Settings (collapsible) */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSenderSettings(!showSenderSettings)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium">Sender Settings</span>
            {(fromName || fromEmail || replyTo) && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                Customized
              </span>
            )}
          </div>
          {showSenderSettings ? (
            <ChevronUp className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          )}
        </button>
        {showSenderSettings && (
          <div className="p-4 space-y-4 border-t">
            <p className="text-xs text-text-secondary">
              Leave blank to use default settings from Admin Settings.
              {emailSettings && (
                <> Default: <strong>{emailSettings.emailFromName}</strong> &lt;{emailSettings.emailFromAddress}&gt;</>
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="From Name (optional)"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder={emailSettings?.emailFromName || 'Nebiswera'}
              />
              <Input
                label="From Email (optional)"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder={emailSettings?.emailFromAddress || 'noreply@nebiswera.com'}
              />
            </div>
            <Input
              label="Reply-To Email (optional)"
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="Same as From Email if not set"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Actions
        </h4>
        {availableTags.length === 0 ? (
          <p className="text-sm text-text-secondary">No tags available.</p>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">Tag contact with:</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag.id)
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
