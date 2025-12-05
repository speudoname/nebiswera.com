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
  Tag,
  Sparkles,
  FileText,
  Loader2,
  Settings,
  BookOpen,
  Trophy,
  Clock,
  AlertTriangle,
  Award,
  Play,
  Target,
  HelpCircle,
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

interface CourseNotification {
  id: string
  templateKey: string | null
  trigger: string
  triggerMinutes: number
  triggerDescription: string
  conditions: Record<string, unknown> | null
  channel: string
  subject: string | null
  previewText: string | null
  bodyHtml: string | null
  bodyText: string | null
  bodyDesign: string | null
  fromName: string | null
  fromEmail: string | null
  replyTo: string | null
  actions: NotificationAction[] | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  stats?: {
    sent: number
    pending: number
    queued: number
    logged: number
  }
  createdAt: string
  updatedAt: string
}

interface ContactTag {
  id: string
  name: string
  color: string
}

interface EmailSettings {
  emailFromName: string
  emailFromAddress: string
}

interface CourseNotificationsEditorProps {
  courseId: string
  courseTitle: string
  courseLocale: 'ka' | 'en'
  initialNotifications: CourseNotification[]
  onNotificationsChange: (notifications: CourseNotification[]) => void
}

// Trigger type configurations
type TriggerType =
  | 'AFTER_ENROLLMENT'
  | 'ON_COURSE_START'
  | 'ON_LESSON_COMPLETE'
  | 'ON_MODULE_COMPLETE'
  | 'ON_COURSE_COMPLETE'
  | 'ON_QUIZ_PASS'
  | 'ON_QUIZ_FAIL'
  | 'ON_INACTIVITY'
  | 'BEFORE_EXPIRATION'
  | 'ON_CERTIFICATE_ISSUED'

interface TriggerConfig {
  label: string
  description: string
  icon: typeof Bell
  color: string
  bgColor: string
  category: 'enrollment' | 'progress' | 'quiz' | 'engagement' | 'completion'
}

const TRIGGER_CONFIGS: Record<TriggerType, TriggerConfig> = {
  AFTER_ENROLLMENT: {
    label: 'After Enrollment',
    description: 'When a student enrolls in the course',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    category: 'enrollment',
  },
  ON_COURSE_START: {
    label: 'Course Started',
    description: 'When student starts their first lesson',
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    category: 'progress',
  },
  ON_LESSON_COMPLETE: {
    label: 'Lesson Complete',
    description: 'When a lesson is completed (use conditions for milestones)',
    icon: BookOpen,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
    category: 'progress',
  },
  ON_MODULE_COMPLETE: {
    label: 'Module Complete',
    description: 'When a module is completed',
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    category: 'progress',
  },
  ON_COURSE_COMPLETE: {
    label: 'Course Complete',
    description: 'When all lessons are completed',
    icon: Trophy,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
    category: 'completion',
  },
  ON_QUIZ_PASS: {
    label: 'Quiz Passed',
    description: 'When student passes a quiz',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100',
    category: 'quiz',
  },
  ON_QUIZ_FAIL: {
    label: 'Quiz Failed',
    description: 'When student fails a quiz',
    icon: HelpCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    category: 'quiz',
  },
  ON_INACTIVITY: {
    label: 'Inactivity',
    description: 'After period of no activity',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    category: 'engagement',
  },
  BEFORE_EXPIRATION: {
    label: 'Before Expiration',
    description: 'Before course access expires',
    icon: AlertTriangle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-100',
    category: 'engagement',
  },
  ON_CERTIFICATE_ISSUED: {
    label: 'Certificate Issued',
    description: 'When certificate is generated',
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    category: 'completion',
  },
}

// Template descriptions for display
interface TemplateInfo {
  name: string
  description: string
}

const TEMPLATE_DESCRIPTIONS: Record<string, TemplateInfo> = {
  'enrollment-welcome': {
    name: 'Enrollment Welcome',
    description: 'Sent immediately after enrollment',
  },
  'enrollment-nudge': {
    name: 'Enrollment Nudge',
    description: 'Sent if student enrolled but never started',
  },
  'course-started': {
    name: 'Course Started',
    description: 'Sent when student starts first lesson',
  },
  'halfway-milestone': {
    name: 'Halfway Milestone',
    description: 'Congratulation at 50% progress',
  },
  'course-completed': {
    name: 'Course Completed',
    description: 'Sent when all lessons are done',
  },
  'quiz-passed': {
    name: 'Quiz Passed',
    description: 'Sent when student passes a quiz',
  },
  'quiz-failed': {
    name: 'Quiz Failed',
    description: 'Encouragement to retry after failing',
  },
  'inactivity-7d': {
    name: '7-Day Inactivity',
    description: 'Reminder after 7 days inactive',
  },
  'inactivity-14d': {
    name: '14-Day Inactivity',
    description: 'Reminder after 14 days inactive',
  },
  'expiration-7d': {
    name: '7-Day Expiration Warning',
    description: 'Warning 7 days before access expires',
  },
  'expiration-1d': {
    name: '1-Day Expiration Warning',
    description: 'Urgent warning 1 day before expiry',
  },
  'certificate-issued': {
    name: 'Certificate Issued',
    description: 'Certificate download notification',
  },
}

// Timing options for different trigger types
const TIMING_OPTIONS: Record<string, { label: string; value: number }[]> = {
  AFTER_ENROLLMENT: [
    { label: 'Immediately', value: 0 },
    { label: '15 minutes after', value: 15 },
    { label: '1 hour after', value: 60 },
    { label: '24 hours after', value: 1440 },
    { label: '48 hours after', value: 2880 },
    { label: '72 hours after', value: 4320 },
  ],
  ON_INACTIVITY: [
    { label: '3 days', value: 4320 },
    { label: '7 days', value: 10080 },
    { label: '14 days', value: 20160 },
    { label: '30 days', value: 43200 },
  ],
  BEFORE_EXPIRATION: [
    { label: '1 day before', value: 1440 },
    { label: '3 days before', value: 4320 },
    { label: '7 days before', value: 10080 },
    { label: '14 days before', value: 20160 },
  ],
  default: [{ label: 'Immediately', value: 0 }],
}

// Template variables reference
const TEMPLATE_VARIABLES = [
  { key: '{{firstName}}', desc: 'Student first name' },
  { key: '{{fullName}}', desc: 'Student full name' },
  { key: '{{email}}', desc: 'Student email' },
  { key: '{{courseTitle}}', desc: 'Course title' },
  { key: '{{courseUrl}}', desc: 'Course URL' },
  { key: '{{continueUrl}}', desc: 'Continue learning URL' },
  { key: '{{progressPercent}}', desc: 'Progress percentage' },
  { key: '{{lessonsCompleted}}', desc: 'Lessons completed count' },
  { key: '{{totalLessons}}', desc: 'Total lessons count' },
  { key: '{{quizTitle}}', desc: 'Quiz title (quiz notifications)' },
  { key: '{{quizScore}}', desc: 'Quiz score (quiz notifications)' },
  { key: '{{expiresDate}}', desc: 'Access expiration date' },
  { key: '{{certificateUrl}}', desc: 'Certificate URL' },
]

// Category grouping
const CATEGORY_LABELS: Record<string, string> = {
  enrollment: 'Enrollment',
  progress: 'Progress & Milestones',
  quiz: 'Quiz Results',
  engagement: 'Engagement & Reminders',
  completion: 'Completion & Certificates',
}

export function CourseNotificationsEditor({
  courseId,
  courseTitle,
  courseLocale,
  initialNotifications,
  onNotificationsChange,
}: CourseNotificationsEditorProps) {
  const [notifications, setNotifications] = useState<CourseNotification[]>(initialNotifications)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<ContactTag[]>([])
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)

  // Fetch available tags and email settings
  useEffect(() => {
    async function fetchData() {
      try {
        const [tagsRes, settingsRes] = await Promise.all([
          fetch('/api/admin/contacts/tags'),
          fetch('/api/admin/settings'),
        ])

        if (tagsRes.ok) {
          const data = await tagsRes.json()
          setAvailableTags(data.tags || [])
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
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

  // Update parent when notifications change
  useEffect(() => {
    onNotificationsChange(notifications)
  }, [notifications, onNotificationsChange])

  const showSaveMessage = (message: string) => {
    setSaveMessage(message)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleAddNotification = async (newNotification: Partial<CourseNotification>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification),
      })

      if (!response.ok) throw new Error('Failed to create notification')

      const data = await response.json()
      setNotifications([...notifications, data.notification])
      setShowAddModal(false)
      showSaveMessage('Notification added!')
    } catch (error) {
      console.error(error)
      alert('Failed to create notification')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateNotification = async (notification: CourseNotification) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/notifications/${notification.id}`,
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
      showSaveMessage('Notification updated!')
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
        `/api/admin/courses/${courseId}/notifications/${id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete notification')

      setNotifications(notifications.filter((n) => n.id !== id))
      showSaveMessage('Notification deleted!')
    } catch (error) {
      console.error(error)
      alert('Failed to delete notification')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (notification: CourseNotification) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/notifications/${notification.id}`,
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

  // Group notifications by category
  const groupedNotifications = notifications.reduce(
    (acc, n) => {
      const triggerConfig = TRIGGER_CONFIGS[n.trigger as TriggerType]
      const category = triggerConfig?.category || 'engagement'
      if (!acc[category]) acc[category] = []
      acc[category].push(n)
      return acc
    },
    {} as Record<string, CourseNotification[]>
  )

  const categoryOrder = ['enrollment', 'progress', 'quiz', 'engagement', 'completion']

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
            Automated emails sent based on student progress. Templates send in the course language ({courseLocale === 'ka' ? 'Georgian' : 'English'}).
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Notification
        </Button>
      </div>

      {/* Template variables info */}
      <Card variant="raised" padding="sm">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">
              <strong>Templates:</strong> Default notifications use pre-built templates that can be customized.
              Use variables like <code className="bg-gray-100 px-1 rounded">{`{{firstName}}`}</code> for personalization.
            </p>
          </div>
        </div>
      </Card>

      {/* Notification groups by category */}
      {categoryOrder.map((category) => {
        const categoryNotifications = groupedNotifications[category] || []
        if (categoryNotifications.length === 0) return null

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              {CATEGORY_LABELS[category]}
              <span className="text-text-muted font-normal">({categoryNotifications.length})</span>
            </h3>

            <div className="space-y-2">
              {categoryNotifications.map((notification) => {
                const isExpanded = expandedId === notification.id
                const isEditing = editingId === notification.id
                const templateInfo = notification.templateKey
                  ? TEMPLATE_DESCRIPTIONS[notification.templateKey]
                  : null
                const triggerConfig = TRIGGER_CONFIGS[notification.trigger as TriggerType]
                const Icon = triggerConfig?.icon || Bell

                return (
                  <Card
                    key={notification.id}
                    variant="raised"
                    padding="md"
                    className={!notification.isActive ? 'opacity-60' : ''}
                  >
                    {isEditing ? (
                      <NotificationEditForm
                        notification={notification}
                        courseTitle={courseTitle}
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
                              <div className={`p-1 rounded ${triggerConfig?.bgColor || 'bg-gray-100'}`}>
                                <Icon className={`w-4 h-4 ${triggerConfig?.color || 'text-gray-500'}`} />
                              </div>
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
                              <span className={`text-xs px-2 py-0.5 rounded ${triggerConfig?.bgColor || 'bg-gray-100'} ${triggerConfig?.color || 'text-gray-500'}`}>
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
                            {/* Template info */}
                            {templateInfo && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  <FileText className="w-4 h-4 inline mr-1" />
                                  Based on template: <strong>{templateInfo.name}</strong>. Content has been
                                  saved for this course.
                                </p>
                              </div>
                            )}

                            {/* Email subject */}
                            {notification.subject && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-text-secondary uppercase">Subject</h5>
                                <p className="text-sm bg-gray-50 rounded-lg p-3">{notification.subject}</p>
                              </div>
                            )}

                            {/* Conditions */}
                            {notification.conditions && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-text-secondary uppercase">Conditions</h5>
                                <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto">
                                  {JSON.stringify(notification.conditions, null, 2)}
                                </pre>
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
          </div>
        )
      })}

      {/* Add notification modal */}
      {showAddModal && (
        <AddNotificationModal
          courseId={courseId}
          courseTitle={courseTitle}
          courseLocale={courseLocale}
          availableTags={availableTags}
          emailSettings={emailSettings}
          existingTemplateKeys={notifications.filter((n) => n.templateKey).map((n) => n.templateKey!)}
          onAdd={handleAddNotification}
          onClose={() => setShowAddModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

// Add Notification Modal
function AddNotificationModal({
  courseId,
  courseTitle,
  courseLocale,
  availableTags,
  emailSettings,
  existingTemplateKeys,
  onAdd,
  onClose,
  isSaving,
}: {
  courseId: string
  courseTitle: string
  courseLocale: 'ka' | 'en'
  availableTags: ContactTag[]
  emailSettings: EmailSettings | null
  existingTemplateKeys: string[]
  onAdd: (notification: Partial<CourseNotification>) => void
  onClose: () => void
  isSaving: boolean
}) {
  const [step, setStep] = useState<'choose' | 'template' | 'type' | 'timing' | 'content'>('choose')
  const [trigger, setTrigger] = useState<TriggerType>('AFTER_ENROLLMENT')
  const [triggerMinutes, setTriggerMinutes] = useState<number>(0)
  const [conditions, setConditions] = useState<Record<string, unknown> | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null)
  const [cameFromTemplate, setCameFromTemplate] = useState(false)
  const [showSenderSettings, setShowSenderSettings] = useState(false)

  // Content state
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyDesign, setBodyDesign] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Sender settings
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')

  const editorRef = useRef<MailyEditorRef>(null)

  // Available templates (not already added)
  const availableTemplates = Object.entries(TEMPLATE_DESCRIPTIONS).filter(
    ([key]) => !existingTemplateKeys.includes(key)
  )

  const handleSelectTrigger = (t: TriggerType) => {
    setTrigger(t)
    const options = TIMING_OPTIONS[t] || TIMING_OPTIONS.default
    setTriggerMinutes(options[0]?.value || 0)
    setStep('timing')
  }

  // Load template content from API
  const handleSelectTemplate = async (templateKey: string) => {
    setLoadingTemplate(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/notifications/templates/${templateKey}?locale=${courseLocale}`)
      if (!res.ok) throw new Error('Failed to load template')

      const data = await res.json()

      setSelectedTemplateKey(templateKey)
      setTrigger(data.trigger)
      setTriggerMinutes(data.triggerMinutes)
      setConditions(data.conditions || null)
      setSubject(data.subject || '')
      setBodyHtml(data.bodyHtml || '')
      setCameFromTemplate(true)
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
      templateKey: selectedTemplateKey,
      trigger,
      triggerMinutes,
      conditions,
      channel: 'EMAIL',
      subject,
      bodyHtml: finalBodyHtml || null,
      bodyText: null,
      bodyDesign: finalBodyDesign || null,
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
              {step === 'type' && 'Choose the trigger event'}
              {step === 'timing' && 'Set the timing'}
              {step === 'content' && 'Write your email content'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step: Choose between template or custom */}
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
                    Choose from standard course notification templates. Content will load in {courseLocale === 'ka' ? 'Georgian' : 'English'}.
                  </p>
                  {availableTemplates.length > 0 ? (
                    <p className="text-xs text-primary-500 mt-1">
                      {availableTemplates.length} template{availableTemplates.length !== 1 ? 's' : ''} available
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">All templates already added</p>
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
                    Write your own notification with custom content and triggers.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Step: Select template */}
          {step === 'template' && (
            <div className="space-y-4">
              <button onClick={() => setStep('choose')} className="text-sm text-primary-500 hover:text-primary-600">
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
                  <p className="text-sm font-medium text-text-secondary">Select a template to add:</p>
                  {availableTemplates.map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectTemplate(key)}
                      disabled={isSaving || loadingTemplate}
                      className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary-500 hover:bg-primary-50 transition-all text-left disabled:opacity-50"
                    >
                      <div>
                        <p className="font-medium">{info.name}</p>
                        <p className="text-sm text-text-secondary">{info.description}</p>
                      </div>
                      {loadingTemplate ? (
                        <Loader2 className="w-5 h-5 text-primary-500 flex-shrink-0 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Select trigger type (for custom) */}
          {step === 'type' && (
            <div className="space-y-4">
              <button onClick={() => setStep('choose')} className="text-sm text-primary-500 hover:text-primary-600">
                &larr; Back
              </button>

              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(TRIGGER_CONFIGS) as [TriggerType, TriggerConfig][]).map(
                  ([type, config]) => (
                    <button
                      key={type}
                      onClick={() => handleSelectTrigger(type)}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className={`p-1.5 rounded ${config.bgColor}`}>
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-text-secondary">{config.description}</p>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step: Set timing */}
          {step === 'timing' && (
            <div className="space-y-4">
              <button onClick={() => setStep('type')} className="text-sm text-primary-500 hover:text-primary-600">
                &larr; Back
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">When should this email be sent?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(TIMING_OPTIONS[trigger] || TIMING_OPTIONS.default).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTriggerMinutes(option.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        triggerMinutes === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => setStep('content')} className="w-full">
                  Continue to Email Content
                </Button>
              </div>
            </div>
          )}

          {/* Step: Email content */}
          {step === 'content' && (
            <div className="space-y-6">
              <button
                onClick={() => {
                  if (cameFromTemplate) {
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

              {/* Template badge */}
              {selectedTemplateKey && (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Based on: <strong>{TEMPLATE_DESCRIPTIONS[selectedTemplateKey]?.name}</strong>
                    {' '}({courseLocale === 'ka' ? 'Georgian' : 'English'})
                  </p>
                </div>
              )}

              {/* Template variables */}
              <Card variant="raised" padding="sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Available template variables:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARIABLES.slice(0, 8).map((v) => (
                        <code
                          key={v.key}
                          className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono"
                          title={v.desc}
                        >
                          {v.key}
                        </code>
                      ))}
                      <span className="text-xs text-text-muted">+{TEMPLATE_VARIABLES.length - 8} more</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sender Settings */}
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
                      Leave blank to use default settings.
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
                  placeholder={`Your "${courseTitle}" course update`}
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

              {/* Actions */}
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Actions (when this email is sent)
                </h4>
                {availableTags.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No tags available. Create tags in Contacts section first.
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

// Edit Notification Form
function NotificationEditForm({
  notification,
  courseTitle,
  availableTags,
  emailSettings,
  onSave,
  onCancel,
  isSaving,
}: {
  notification: CourseNotification
  courseTitle: string
  availableTags: ContactTag[]
  emailSettings: EmailSettings | null
  onSave: (notification: CourseNotification) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [triggerMinutes, setTriggerMinutes] = useState(notification.triggerMinutes)
  const [conditions, setConditions] = useState<Record<string, unknown> | null>(notification.conditions)
  const [subject, setSubject] = useState(notification.subject || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    notification.actions?.map((a) => a.tagId) || []
  )

  const [fromName, setFromName] = useState(notification.fromName || '')
  const [fromEmail, setFromEmail] = useState(notification.fromEmail || '')
  const [replyTo, setReplyTo] = useState(notification.replyTo || '')
  const [showSenderSettings, setShowSenderSettings] = useState(false)

  const editorRef = useRef<MailyEditorRef>(null)

  const handleSave = async () => {
    let finalBodyHtml = notification.bodyHtml
    let finalBodyDesign: string | null = notification.bodyDesign

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
      bodyDesign: finalBodyDesign,
      fromName: fromName || null,
      fromEmail: fromEmail || null,
      replyTo: replyTo || null,
      actions: actions.length > 0 ? actions : null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Template variables */}
      <Card variant="raised" padding="sm">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary mb-1">Available variables:</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.slice(0, 6).map((v) => (
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
          {(TIMING_OPTIONS[notification.trigger as keyof typeof TIMING_OPTIONS] || TIMING_OPTIONS.default).map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )
          )}
        </select>
      </div>

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
              initialContent={(notification.bodyDesign as string) || notification.bodyHtml || undefined}
            />
          </div>
        </div>
      </div>

      {/* Sender Settings */}
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
              Leave blank to use default settings.
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
