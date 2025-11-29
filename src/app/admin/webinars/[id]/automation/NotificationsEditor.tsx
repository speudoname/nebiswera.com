'use client'

import { useState } from 'react'
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
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  trigger: string
  triggerMinutes: number | null
  subject: string
  bodyHtml: string
  bodyText: string | null
  enabled: boolean
}

interface NotificationsEditorProps {
  webinarId: string
  webinarTitle: string
  initialNotifications: Notification[]
}

const NOTIFICATION_TRIGGERS = [
  {
    value: 'REGISTERED_SCHEDULED',
    label: 'Registration Confirmation (Scheduled)',
    description: 'Sent immediately after registering for a scheduled session',
    type: 'CONFIRMATION',
    icon: CheckCircle,
  },
  {
    value: 'REGISTERED_REPLAY',
    label: 'Registration Confirmation (Replay)',
    description: 'Sent immediately after registering for replay',
    type: 'CONFIRMATION',
    icon: CheckCircle,
  },
  {
    value: 'REGISTERED_ON_DEMAND',
    label: 'Registration Confirmation (On-Demand)',
    description: 'Sent immediately after registering for on-demand viewing',
    type: 'CONFIRMATION',
    icon: CheckCircle,
  },
  {
    value: 'REMINDER_BEFORE',
    label: 'Reminder Before Session',
    description: 'Sent X minutes before the session starts',
    type: 'REMINDER',
    icon: Clock,
    hasMinutes: true,
  },
  {
    value: 'FOLLOW_UP_ATTENDED',
    label: 'Follow-up (Attended)',
    description: 'Sent after attending the webinar',
    type: 'FOLLOW_UP',
    icon: Mail,
    hasMinutes: true,
  },
  {
    value: 'FOLLOW_UP_COMPLETED',
    label: 'Follow-up (Completed)',
    description: 'Sent after watching to the end',
    type: 'FOLLOW_UP',
    icon: Mail,
    hasMinutes: true,
  },
  {
    value: 'FOLLOW_UP_MISSED',
    label: 'Follow-up (Missed)',
    description: 'Sent when they registered but never showed up',
    type: 'FOLLOW_UP',
    icon: AlertCircle,
    hasMinutes: true,
  },
  {
    value: 'FOLLOW_UP_LEFT_EARLY',
    label: 'Follow-up (Left Early)',
    description: 'Sent when they left before completing',
    type: 'FOLLOW_UP',
    icon: AlertCircle,
    hasMinutes: true,
  },
]

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  REGISTERED_SCHEDULED: {
    subject: "You're registered for {{webinar_title}}!",
    body: `<p>Hi {{first_name}},</p>
<p>Thank you for registering for <strong>{{webinar_title}}</strong>!</p>
<p><strong>Your session:</strong> {{session_date}}</p>
<p><a href="{{watch_url}}">Add to Calendar</a></p>
<p>See you there!</p>`,
  },
  REGISTERED_ON_DEMAND: {
    subject: 'Watch {{webinar_title}} now!',
    body: `<p>Hi {{first_name}},</p>
<p>Thank you for registering! You can watch <strong>{{webinar_title}}</strong> right now.</p>
<p><a href="{{watch_url}}">Watch Now</a></p>`,
  },
  REMINDER_BEFORE: {
    subject: '{{webinar_title}} starts soon!',
    body: `<p>Hi {{first_name}},</p>
<p>Just a reminder that <strong>{{webinar_title}}</strong> starts in {{minutes_until}} minutes!</p>
<p><a href="{{watch_url}}">Join Now</a></p>`,
  },
  FOLLOW_UP_ATTENDED: {
    subject: 'Thanks for attending {{webinar_title}}!',
    body: `<p>Hi {{first_name}},</p>
<p>Thank you for attending <strong>{{webinar_title}}</strong>!</p>
<p>Missed something? <a href="{{replay_url}}">Watch the replay</a></p>`,
  },
  FOLLOW_UP_MISSED: {
    subject: 'We missed you at {{webinar_title}}',
    body: `<p>Hi {{first_name}},</p>
<p>We noticed you couldn't make it to <strong>{{webinar_title}}</strong>.</p>
<p>Good news - you can still watch the replay!</p>
<p><a href="{{replay_url}}">Watch Replay</a></p>`,
  },
}

export function NotificationsEditor({
  webinarId,
  webinarTitle,
  initialNotifications,
}: NotificationsEditorProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)

  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    type: 'CONFIRMATION',
    trigger: '',
    triggerMinutes: 60,
    subject: '',
    bodyHtml: '',
    enabled: true,
  })

  const handleSelectTrigger = (trigger: string) => {
    const triggerConfig = NOTIFICATION_TRIGGERS.find((t) => t.value === trigger)
    const template = DEFAULT_TEMPLATES[trigger] || { subject: '', body: '' }

    setNewNotification({
      type: triggerConfig?.type || 'CONFIRMATION',
      trigger,
      triggerMinutes: triggerConfig?.hasMinutes ? 60 : null,
      subject: template.subject.replace('{{webinar_title}}', webinarTitle),
      bodyHtml: template.body,
      enabled: true,
    })
    setSelectedTrigger(trigger)
  }

  const handleAddNotification = async () => {
    if (!newNotification.trigger || !newNotification.subject) {
      alert('Please fill in all required fields')
      return
    }

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
      setSelectedTrigger(null)
      setNewNotification({
        type: 'CONFIRMATION',
        trigger: '',
        triggerMinutes: 60,
        subject: '',
        bodyHtml: '',
        enabled: true,
      })
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

  const getTriggerConfig = (trigger: string) =>
    NOTIFICATION_TRIGGERS.find((t) => t.value === trigger)

  return (
    <div className="space-y-6">
      {/* Save message */}
      {saveMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
          {saveMessage}
        </div>
      )}

      {/* Available variables info */}
      <Card variant="raised" padding="md">
        <h3 className="font-semibold mb-2">Available Template Variables</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            '{{first_name}}',
            '{{email}}',
            '{{webinar_title}}',
            '{{session_date}}',
            '{{watch_url}}',
            '{{replay_url}}',
            '{{minutes_until}}',
          ].map((variable) => (
            <code
              key={variable}
              className="bg-gray-100 px-2 py-1 rounded text-xs font-mono"
            >
              {variable}
            </code>
          ))}
        </div>
      </Card>

      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Notification
        </Button>
      </div>

      {/* Notifications list by type */}
      {['CONFIRMATION', 'REMINDER', 'FOLLOW_UP'].map((type) => {
        const typeNotifications = notifications.filter((n) => n.type === type)
        if (typeNotifications.length === 0 && type !== 'CONFIRMATION') return null

        return (
          <div key={type} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {type === 'CONFIRMATION' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {type === 'REMINDER' && <Bell className="w-5 h-5 text-blue-500" />}
              {type === 'FOLLOW_UP' && <Mail className="w-5 h-5 text-purple-500" />}
              {type.replace('_', ' ')}
            </h2>

            {typeNotifications.length === 0 ? (
              <Card variant="raised" padding="md">
                <p className="text-text-secondary text-sm">
                  No {type.toLowerCase().replace('_', ' ')} notifications configured.
                </p>
              </Card>
            ) : (
              typeNotifications.map((notification) => {
                const triggerConfig = getTriggerConfig(notification.trigger)
                const isEditing = editingId === notification.id

                return (
                  <Card
                    key={notification.id}
                    variant="raised"
                    padding="md"
                    className={`${
                      !notification.enabled ? 'opacity-60' : ''
                    } ${isEditing ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    {isEditing ? (
                      <NotificationEditForm
                        notification={notification}
                        onSave={handleUpdateNotification}
                        onCancel={() => setEditingId(null)}
                        isSaving={isSaving}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-text-primary">
                                {triggerConfig?.label || notification.trigger}
                              </h3>
                              {!notification.enabled && (
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-text-secondary mt-1">
                              {triggerConfig?.description}
                              {notification.triggerMinutes && (
                                <span className="ml-2 text-primary-500">
                                  ({notification.triggerMinutes} minutes)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingId(notification.id)}
                              className="p-2 text-text-secondary hover:text-primary-500 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm">
                            Subject: {notification.subject}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        )
      })}

      {/* Add notification modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Notification</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedTrigger(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!selectedTrigger ? (
                // Trigger selection
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select Notification Type
                  </label>
                  {NOTIFICATION_TRIGGERS.map((trigger) => {
                    const exists = notifications.some((n) => n.trigger === trigger.value)
                    return (
                      <button
                        key={trigger.value}
                        onClick={() => !exists && handleSelectTrigger(trigger.value)}
                        disabled={exists}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                          exists
                            ? 'opacity-50 cursor-not-allowed bg-gray-50'
                            : 'hover:border-primary-500 hover:bg-primary-50'
                        }`}
                      >
                        <trigger.icon className="w-5 h-5 text-primary-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{trigger.label}</p>
                          <p className="text-xs text-text-muted">{trigger.description}</p>
                          {exists && (
                            <p className="text-xs text-orange-500 mt-1">Already configured</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                // Email content editing
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedTrigger(null)}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    &larr; Back to trigger selection
                  </button>

                  {getTriggerConfig(newNotification.trigger || '')?.hasMinutes && (
                    <Input
                      label="Minutes (before/after)"
                      type="number"
                      value={newNotification.triggerMinutes || 60}
                      onChange={(e) =>
                        setNewNotification({
                          ...newNotification,
                          triggerMinutes: parseInt(e.target.value) || 60,
                        })
                      }
                    />
                  )}

                  <Input
                    label="Email Subject"
                    value={newNotification.subject || ''}
                    onChange={(e) =>
                      setNewNotification({ ...newNotification, subject: e.target.value })
                    }
                    placeholder="Your webinar starts soon!"
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Email Body (HTML)
                    </label>
                    <textarea
                      value={newNotification.bodyHtml || ''}
                      onChange={(e) =>
                        setNewNotification({ ...newNotification, bodyHtml: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      rows={10}
                      placeholder="<p>Hi {{first_name}},</p>"
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newNotification.enabled !== false}
                      onChange={(e) =>
                        setNewNotification({ ...newNotification, enabled: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              )}
            </div>

            {selectedTrigger && (
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedTrigger(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddNotification} loading={isSaving}>
                  Add Notification
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationEditForm({
  notification,
  onSave,
  onCancel,
  isSaving,
}: {
  notification: Notification
  onSave: (notification: Notification) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [edited, setEdited] = useState(notification)
  const triggerConfig = NOTIFICATION_TRIGGERS.find((t) => t.value === notification.trigger)

  return (
    <div className="space-y-4">
      {triggerConfig?.hasMinutes && (
        <Input
          label="Minutes"
          type="number"
          value={edited.triggerMinutes || 60}
          onChange={(e) =>
            setEdited({ ...edited, triggerMinutes: parseInt(e.target.value) || 60 })
          }
        />
      )}

      <Input
        label="Subject"
        value={edited.subject}
        onChange={(e) => setEdited({ ...edited, subject: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Body (HTML)
        </label>
        <textarea
          value={edited.bodyHtml}
          onChange={(e) => setEdited({ ...edited, bodyHtml: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
          rows={8}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={edited.enabled}
          onChange={(e) => setEdited({ ...edited, enabled: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm">Enabled</span>
      </label>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(edited)} loading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  )
}
