'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Clock, Settings } from 'lucide-react'

type InteractionType =
  | 'POLL'
  | 'QUESTION'
  | 'CTA'
  | 'DOWNLOAD'
  | 'FEEDBACK'
  | 'TIP'
  | 'SPECIAL_OFFER'
  | 'PAUSE'
  | 'QUIZ'
  | 'CONTACT_FORM'

type Position = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER' | 'SIDEBAR' | 'FULL_OVERLAY'

interface InteractionData {
  id?: string
  type: InteractionType
  triggerTime: number
  title: string
  description?: string
  config: any
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  dismissable: boolean
  position: Position
  enabled: boolean
  duration?: number
}

interface InteractionCreatorProps {
  webinarId: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: InteractionData) => Promise<void>
  initialData?: Partial<InteractionData>
  triggerTime: number
}

export function InteractionCreator({
  webinarId,
  isOpen,
  onClose,
  onSave,
  initialData,
  triggerTime,
}: InteractionCreatorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [type, setType] = useState<InteractionType>(initialData?.type || 'POLL')
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [time, setTime] = useState(initialData?.triggerTime ?? triggerTime)
  const [duration, setDuration] = useState<number | undefined>(initialData?.duration)
  const [position, setPosition] = useState<Position>(initialData?.position || 'BOTTOM_RIGHT')
  const [pauseVideo, setPauseVideo] = useState(initialData?.pauseVideo ?? false)
  const [required, setRequired] = useState(initialData?.required ?? false)
  const [showOnReplay, setShowOnReplay] = useState(initialData?.showOnReplay ?? true)
  const [dismissable, setDismissable] = useState(initialData?.dismissable ?? true)
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)

  // Type-specific config
  const [config, setConfig] = useState<any>(initialData?.config || {})

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'POLL')
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setTime(initialData.triggerTime ?? triggerTime)
      setDuration(initialData.duration)
      setPosition(initialData.position || 'BOTTOM_RIGHT')
      setPauseVideo(initialData.pauseVideo ?? false)
      setRequired(initialData.required ?? false)
      setShowOnReplay(initialData.showOnReplay ?? true)
      setDismissable(initialData.dismissable ?? true)
      setEnabled(initialData.enabled ?? true)
      setConfig(initialData.config || {})
    }
  }, [initialData, triggerTime])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        ...(initialData?.id && { id: initialData.id }),
        type,
        triggerTime: time,
        title,
        description,
        config,
        pauseVideo,
        required,
        showOnReplay,
        dismissable,
        position,
        enabled,
        duration,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save interaction:', error)
      alert('Failed to save interaction')
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-neu-light rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neu-light border-b border-neu-dark p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {initialData?.id ? 'Edit Interaction' : 'Create Interaction'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neu-dark rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Interaction Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Interaction Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as InteractionType)
                setConfig({}) // Reset config when type changes
              }}
              className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="POLL">Poll - Multiple choice question</option>
              <option value="QUESTION">Question - Open-ended Q&A</option>
              <option value="CTA">CTA - Call to action button</option>
              <option value="DOWNLOAD">Download - File download</option>
              <option value="FEEDBACK">Feedback - Rating/emoji</option>
              <option value="TIP">Tip - Info notification</option>
              <option value="SPECIAL_OFFER">Special Offer - Timed offer</option>
              <option value="PAUSE">Pause - Explicit pause with message</option>
              <option value="QUIZ">Quiz - Multiple choice with correct answers</option>
              <option value="CONTACT_FORM">Contact Form - Lead capture</option>
            </select>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Trigger Time *
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({formatTime(time)})
                </span>
              </label>
              <input
                type="number"
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value))}
                placeholder="Seconds"
                className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={2}
              className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type-Specific Configuration */}
          <div className="border-t border-neu-dark pt-6">
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            {renderTypeSpecificConfig()}
          </div>

          {/* Behavior Settings */}
          <div className="border-t border-neu-dark pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Behavior Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pauseVideo}
                  onChange={(e) => setPauseVideo(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm">Pause video when shown</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm">Required (must interact to continue)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnReplay}
                  onChange={(e) => setShowOnReplay(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm">Show in replay mode</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dismissable}
                  onChange={(e) => setDismissable(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm">Can be dismissed</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>
          </div>

          {/* Position & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="BOTTOM_RIGHT">Bottom Right</option>
                <option value="BOTTOM_LEFT">Bottom Left</option>
                <option value="TOP_RIGHT">Top Right</option>
                <option value="TOP_LEFT">Top Left</option>
                <option value="CENTER">Center</option>
                <option value="SIDEBAR">Sidebar</option>
                <option value="FULL_OVERLAY">Full Overlay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Duration (seconds, optional)
              </label>
              <input
                type="number"
                value={duration ?? ''}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto-dismiss after..."
                className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neu-light border-t border-neu-dark p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-neu-light shadow-neu hover:shadow-neu-inset transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title}
            className="px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )

  function renderTypeSpecificConfig() {
    switch (type) {
      case 'POLL':
      case 'QUIZ':
        return renderPollQuizConfig()
      case 'QUESTION':
        return renderQuestionConfig()
      case 'CTA':
        return renderCTAConfig()
      case 'DOWNLOAD':
        return renderDownloadConfig()
      case 'FEEDBACK':
        return renderFeedbackConfig()
      case 'TIP':
        return renderTipConfig()
      case 'SPECIAL_OFFER':
        return renderSpecialOfferConfig()
      case 'PAUSE':
        return renderPauseConfig()
      case 'CONTACT_FORM':
        return renderContactFormConfig()
      default:
        return null
    }
  }

  function renderPollQuizConfig() {
    const options = config.options || ['', '']
    const correctAnswers = config.correctAnswers || []

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Options</label>
          <button
            onClick={() => setConfig({ ...config, options: [...options, ''] })}
            className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Option
          </button>
        </div>
        {options.map((option: string, index: number) => (
          <div key={index} className="flex items-center gap-2">
            {type === 'QUIZ' && (
              <input
                type="checkbox"
                checked={correctAnswers.includes(index)}
                onChange={(e) => {
                  const newCorrect = e.target.checked
                    ? [...correctAnswers, index]
                    : correctAnswers.filter((i: number) => i !== index)
                  setConfig({ ...config, correctAnswers: newCorrect })
                }}
                className="w-5 h-5 rounded"
                title="Mark as correct answer"
              />
            )}
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options]
                newOptions[index] = e.target.value
                setConfig({ ...config, options: newOptions })
              }}
              placeholder={`Option ${index + 1}`}
              className="flex-1 p-2 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {options.length > 2 && (
              <button
                onClick={() => {
                  const newOptions = options.filter((_: any, i: number) => i !== index)
                  setConfig({ ...config, options: newOptions })
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {type === 'POLL' && (
          <label className="flex items-center gap-3 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={config.multipleChoice || false}
              onChange={(e) => setConfig({ ...config, multipleChoice: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm">Allow multiple selections</span>
          </label>
        )}
      </div>
    )
  }

  function renderQuestionConfig() {
    return (
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.allowAttachments || false}
            onChange={(e) => setConfig({ ...config, allowAttachments: e.target.checked })}
            className="w-5 h-5 rounded"
          />
          <span className="text-sm">Allow file attachments</span>
        </label>
        <div>
          <label className="block text-sm font-semibold mb-2">Placeholder text</label>
          <input
            type="text"
            value={config.placeholder || ''}
            onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
            placeholder="Enter your question here..."
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
      </div>
    )
  }

  function renderCTAConfig() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">Button Text</label>
          <input
            type="text"
            value={config.buttonText || ''}
            onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
            placeholder="Click here"
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">URL</label>
          <input
            type="url"
            value={config.url || ''}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="https://..."
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.openInNewTab || false}
            onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
            className="w-5 h-5 rounded"
          />
          <span className="text-sm">Open in new tab</span>
        </label>
      </div>
    )
  }

  function renderDownloadConfig() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">File URL</label>
          <input
            type="url"
            value={config.fileUrl || ''}
            onChange={(e) => setConfig({ ...config, fileUrl: e.target.value })}
            placeholder="https://..."
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">File Name</label>
          <input
            type="text"
            value={config.fileName || ''}
            onChange={(e) => setConfig({ ...config, fileName: e.target.value })}
            placeholder="document.pdf"
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
      </div>
    )
  }

  function renderFeedbackConfig() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">Feedback Type</label>
          <select
            value={config.feedbackType || 'rating'}
            onChange={(e) => setConfig({ ...config, feedbackType: e.target.value })}
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          >
            <option value="rating">Star Rating (1-5)</option>
            <option value="emoji">Emoji (Happy/Neutral/Sad)</option>
            <option value="thumbs">Thumbs Up/Down</option>
          </select>
        </div>
      </div>
    )
  }

  function renderTipConfig() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">Tip Content</label>
          <textarea
            value={config.content || ''}
            onChange={(e) => setConfig({ ...config, content: e.target.value })}
            placeholder="Enter tip content..."
            rows={3}
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
      </div>
    )
  }

  function renderSpecialOfferConfig() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">Offer Text</label>
          <textarea
            value={config.offerText || ''}
            onChange={(e) => setConfig({ ...config, offerText: e.target.value })}
            placeholder="Limited time offer..."
            rows={2}
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">CTA Button Text</label>
          <input
            type="text"
            value={config.ctaText || ''}
            onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
            placeholder="Claim Offer"
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">URL</label>
          <input
            type="url"
            value={config.url || ''}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="https://..."
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Countdown Duration (seconds)</label>
          <input
            type="number"
            value={config.countdownDuration || 300}
            onChange={(e) => setConfig({ ...config, countdownDuration: parseInt(e.target.value) })}
            placeholder="300"
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
      </div>
    )
  }

  function renderPauseConfig() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">Pause Message</label>
          <textarea
            value={config.message || ''}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            placeholder="Take a moment to think about this..."
            rows={3}
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Auto-Resume After (seconds, optional)
          </label>
          <input
            type="number"
            value={config.autoResumeDuration || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                autoResumeDuration: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="Leave empty for manual resume"
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
      </div>
    )
  }

  function renderContactFormConfig() {
    return (
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.collectPhone || false}
            onChange={(e) => setConfig({ ...config, collectPhone: e.target.checked })}
            className="w-5 h-5 rounded"
          />
          <span className="text-sm">Collect phone number</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.collectCompany || false}
            onChange={(e) => setConfig({ ...config, collectCompany: e.target.checked })}
            className="w-5 h-5 rounded"
          />
          <span className="text-sm">Collect company name</span>
        </label>
        <div>
          <label className="block text-sm font-semibold mb-2">Success Message</label>
          <input
            type="text"
            value={config.successMessage || ''}
            onChange={(e) => setConfig({ ...config, successMessage: e.target.value })}
            placeholder="Thank you for your information!"
            className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset"
          />
        </div>
      </div>
    )
  }
}
