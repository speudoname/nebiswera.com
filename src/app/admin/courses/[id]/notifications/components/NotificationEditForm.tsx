'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Save, Settings, ChevronDown, ChevronUp, Sparkles, Tag } from 'lucide-react'
import type { MailyEditorRef } from '@/app/admin/campaigns/components/MailyEditor'
import type { CourseNotification, ContactTag, EmailSettings, NotificationAction } from '../types'
import { TIMING_OPTIONS, TEMPLATE_VARIABLES } from '../constants'

const MailyEditor = dynamic(
  () => import('@/app/admin/campaigns/components/MailyEditor').then((mod) => mod.MailyEditor),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" /> }
)

interface NotificationEditFormProps {
  notification: CourseNotification
  courseTitle: string
  availableTags: ContactTag[]
  emailSettings: EmailSettings | null
  onSave: (notification: CourseNotification) => void
  onCancel: () => void
  isSaving: boolean
}

export function NotificationEditForm({
  notification,
  courseTitle,
  availableTags,
  emailSettings,
  onSave,
  onCancel,
  isSaving,
}: NotificationEditFormProps) {
  const [triggerMinutes, setTriggerMinutes] = useState(notification.triggerMinutes)
  const [conditions, setConditions] = useState<Record<string, unknown> | null>(
    notification.conditions
  )
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
          {(
            TIMING_OPTIONS[notification.trigger as keyof typeof TIMING_OPTIONS] ||
            TIMING_OPTIONS.default
          ).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Email content */}
      <div className="space-y-4">
        <Input label="Subject Line" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Email Body</label>
          <div className="border rounded-lg overflow-hidden">
            <MailyEditor
              ref={editorRef}
              initialContent={
                (notification.bodyDesign as string) || notification.bodyHtml || undefined
              }
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
                <>
                  {' '}
                  Default: <strong>{emailSettings.emailFromName}</strong> &lt;
                  {emailSettings.emailFromAddress}&gt;
                </>
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
