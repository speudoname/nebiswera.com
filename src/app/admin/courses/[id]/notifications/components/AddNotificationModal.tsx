'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import {
  Plus,
  X,
  FileText,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp,
  Edit2,
  CheckCircle,
  Sparkles,
  Tag,
} from 'lucide-react'
import type { MailyEditorRef } from '@/app/admin/campaigns/components/MailyEditor'
import type {
  CourseNotification,
  ContactTag,
  EmailSettings,
  TriggerType,
  NotificationAction,
} from '../types'
import {
  TRIGGER_CONFIGS,
  TEMPLATE_DESCRIPTIONS,
  TIMING_OPTIONS,
  TEMPLATE_VARIABLES,
} from '../constants'

const MailyEditor = dynamic(
  () => import('@/app/admin/campaigns/components/MailyEditor').then((mod) => mod.MailyEditor),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" /> }
)

interface AddNotificationModalProps {
  courseId: string
  courseTitle: string
  courseLocale: 'ka' | 'en'
  availableTags: ContactTag[]
  emailSettings: EmailSettings | null
  existingTemplateKeys: string[]
  onAdd: (notification: Partial<CourseNotification>) => void
  onClose: () => void
  isSaving: boolean
}

export function AddNotificationModal({
  courseId,
  courseTitle,
  courseLocale,
  availableTags,
  emailSettings,
  existingTemplateKeys,
  onAdd,
  onClose,
  isSaving,
}: AddNotificationModalProps) {
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
      const res = await fetch(
        `/api/admin/courses/${courseId}/notifications/templates/${templateKey}?locale=${courseLocale}`
      )
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
                    Choose from standard course notification templates. Content will load in{' '}
                    {courseLocale === 'ka' ? 'Georgian' : 'English'}.
                  </p>
                  {availableTemplates.length > 0 ? (
                    <p className="text-xs text-primary-500 mt-1">
                      {availableTemplates.length} template
                      {availableTemplates.length !== 1 ? 's' : ''} available
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
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                &larr; Back
              </button>

              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(TRIGGER_CONFIGS) as [TriggerType, (typeof TRIGGER_CONFIGS)[TriggerType]][]).map(
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
              <button
                onClick={() => setStep('type')}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                &larr; Back
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">
                  When should this email be sent?
                </label>
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
                    Based on: <strong>{TEMPLATE_DESCRIPTIONS[selectedTemplateKey]?.name}</strong> (
                    {courseLocale === 'ka' ? 'Georgian' : 'English'})
                  </p>
                </div>
              )}

              {/* Template variables */}
              <Card variant="raised" padding="sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-secondary mb-1">
                      Available template variables:
                    </p>
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
                      <span className="text-xs text-text-muted">
                        +{TEMPLATE_VARIABLES.length - 8} more
                      </span>
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
                            backgroundColor: selectedTags.includes(tag.id)
                              ? `${tag.color}20`
                              : undefined,
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
