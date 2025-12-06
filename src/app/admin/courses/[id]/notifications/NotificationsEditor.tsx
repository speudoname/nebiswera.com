'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Plus,
  Trash2,
  Edit2,
  Bell,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Tag,
  FileText,
} from 'lucide-react'
import type {
  CourseNotification,
  ContactTag,
  EmailSettings,
  TriggerType,
} from './types'
import {
  TRIGGER_CONFIGS,
  TEMPLATE_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from './constants'
import { AddNotificationModal, NotificationEditForm } from './components'

interface CourseNotificationsEditorProps {
  courseId: string
  courseTitle: string
  courseLocale: 'ka' | 'en'
  initialNotifications: CourseNotification[]
  onNotificationsChange: (notifications: CourseNotification[]) => void
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
            Automated emails sent based on student progress. Templates send in the course language (
            {courseLocale === 'ka' ? 'Georgian' : 'English'}).
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
              <strong>Templates:</strong> Default notifications use pre-built templates that can be
              customized. Use variables like{' '}
              <code className="bg-gray-100 px-1 rounded">{`{{firstName}}`}</code> for
              personalization.
            </p>
          </div>
        </div>
      </Card>

      {/* Notification groups by category */}
      {CATEGORY_ORDER.map((category) => {
        const categoryNotifications = groupedNotifications[category] || []
        if (categoryNotifications.length === 0) return null

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              {CATEGORY_LABELS[category]}
              <span className="text-text-muted font-normal">({categoryNotifications.length})</span>
            </h3>

            <div className="space-y-2">
              {categoryNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  courseTitle={courseTitle}
                  availableTags={availableTags}
                  emailSettings={emailSettings}
                  isExpanded={expandedId === notification.id}
                  isEditing={editingId === notification.id}
                  isSaving={isSaving}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === notification.id ? null : notification.id)
                  }
                  onEdit={() => setEditingId(notification.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={handleUpdateNotification}
                  onDelete={() => handleDeleteNotification(notification.id)}
                  onToggleActive={() => handleToggleActive(notification)}
                />
              ))}
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
          existingTemplateKeys={notifications
            .filter((n) => n.templateKey)
            .map((n) => n.templateKey!)}
          onAdd={handleAddNotification}
          onClose={() => setShowAddModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

// Notification Card component
interface NotificationCardProps {
  notification: CourseNotification
  courseTitle: string
  availableTags: ContactTag[]
  emailSettings: EmailSettings | null
  isExpanded: boolean
  isEditing: boolean
  isSaving: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (notification: CourseNotification) => void
  onDelete: () => void
  onToggleActive: () => void
}

function NotificationCard({
  notification,
  courseTitle,
  availableTags,
  emailSettings,
  isExpanded,
  isEditing,
  isSaving,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onToggleActive,
}: NotificationCardProps) {
  const templateInfo = notification.templateKey
    ? TEMPLATE_DESCRIPTIONS[notification.templateKey]
    : null
  const triggerConfig = TRIGGER_CONFIGS[notification.trigger as TriggerType]
  const Icon = triggerConfig?.icon || Bell

  return (
    <Card
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
          onSave={onSave}
          onCancel={onCancelEdit}
          isSaving={isSaving}
        />
      ) : (
        <>
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`p-1 rounded ${triggerConfig?.bgColor || 'bg-gray-100'}`}>
                  <Icon className={`w-4 h-4 ${triggerConfig?.color || 'text-gray-500'}`} />
                </div>
                {templateInfo ? (
                  <>
                    <FileText className="w-4 h-4 text-primary-500" />
                    <h4 className="font-medium text-text-primary">{templateInfo.name}</h4>
                  </>
                ) : (
                  <h4 className="font-medium text-text-primary truncate">
                    {notification.subject || 'Custom Email'}
                  </h4>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${triggerConfig?.bgColor || 'bg-gray-100'} ${triggerConfig?.color || 'text-gray-500'}`}
                >
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
                <p className="text-sm text-text-secondary mt-1">{templateInfo.description}</p>
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
                  onToggleActive()
                }}
                className={`p-1.5 rounded transition-colors ${
                  notification.isActive
                    ? 'text-green-500 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={notification.isActive ? 'Disable' : 'Enable'}
              >
                {notification.isActive ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
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
                    Based on template: <strong>{templateInfo.name}</strong>. Content has been saved
                    for this course.
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
                  <h5 className="text-xs font-semibold text-text-secondary uppercase">
                    Conditions
                  </h5>
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
                    onEdit()
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
                    onDelete()
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
}
