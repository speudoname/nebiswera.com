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
  BarChart2,
  MousePointer,
  Download,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Gift,
  GripVertical,
} from 'lucide-react'

interface Interaction {
  id: string
  type: string
  triggerTime: number
  duration: number | null
  title: string
  config: Record<string, unknown>
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  position: string
  enabled: boolean
}

interface InteractionsEditorProps {
  webinarId: string
  videoDuration: number
  initialInteractions: Interaction[]
}

const INTERACTION_TYPES = [
  { value: 'POLL', label: 'Poll', icon: BarChart2, description: 'Multiple choice question' },
  { value: 'CTA', label: 'Call to Action', icon: MousePointer, description: 'Button with link' },
  { value: 'DOWNLOAD', label: 'Download', icon: Download, description: 'Downloadable resource' },
  { value: 'QUESTION', label: 'Question', icon: MessageSquare, description: 'Open-ended Q&A' },
  { value: 'FEEDBACK', label: 'Feedback', icon: ThumbsUp, description: 'Rating/emoji feedback' },
  { value: 'TIP', label: 'Tip', icon: Lightbulb, description: 'Info tooltip' },
  { value: 'SPECIAL_OFFER', label: 'Special Offer', icon: Gift, description: 'Timed offer' },
]

const POSITIONS = [
  { value: 'BOTTOM_RIGHT', label: 'Bottom Right' },
  { value: 'BOTTOM_LEFT', label: 'Bottom Left' },
  { value: 'TOP_RIGHT', label: 'Top Right' },
  { value: 'TOP_LEFT', label: 'Top Left' },
  { value: 'CENTER', label: 'Center' },
  { value: 'FULL_OVERLAY', label: 'Full Overlay' },
]

export function InteractionsEditor({
  webinarId,
  videoDuration,
  initialInteractions,
}: InteractionsEditorProps) {
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // New interaction form state
  const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>({
    type: 'POLL',
    triggerTime: 0,
    duration: 30,
    title: '',
    config: {},
    pauseVideo: false,
    required: false,
    showOnReplay: true,
    position: 'BOTTOM_RIGHT',
    enabled: true,
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return parseInt(timeStr) || 0
  }

  const handleAddInteraction = async () => {
    if (!newInteraction.title || !newInteraction.type) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/webinars/${webinarId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInteraction),
      })

      if (!response.ok) throw new Error('Failed to create interaction')

      const data = await response.json()
      setInteractions([...interactions, data.interaction])
      setShowAddModal(false)
      setNewInteraction({
        type: 'POLL',
        triggerTime: 0,
        duration: 30,
        title: '',
        config: {},
        pauseVideo: false,
        required: false,
        showOnReplay: true,
        position: 'BOTTOM_RIGHT',
        enabled: true,
      })
      setSaveMessage('Interaction added!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to create interaction')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateInteraction = async (interaction: Interaction) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${interaction.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interaction),
        }
      )

      if (!response.ok) throw new Error('Failed to update interaction')

      const data = await response.json()
      setInteractions(
        interactions.map((i) => (i.id === interaction.id ? data.interaction : i))
      )
      setEditingId(null)
      setSaveMessage('Interaction updated!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to update interaction')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteInteraction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete interaction')

      setInteractions(interactions.filter((i) => i.id !== id))
      setSaveMessage('Interaction deleted!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to delete interaction')
    } finally {
      setIsSaving(false)
    }
  }

  const getInteractionIcon = (type: string) => {
    const iconType = INTERACTION_TYPES.find((t) => t.value === type)
    return iconType?.icon || BarChart2
  }

  return (
    <div className="space-y-6">
      {/* Save message */}
      {saveMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
          {saveMessage}
        </div>
      )}

      {/* Timeline view */}
      <Card variant="raised" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Interaction Timeline</h2>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Interaction
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline bar */}
          <div className="h-2 bg-neu-dark rounded-full relative">
            {interactions.map((interaction) => {
              const position = (interaction.triggerTime / videoDuration) * 100
              const Icon = getInteractionIcon(interaction.type)
              return (
                <button
                  key={interaction.id}
                  className={`absolute -top-3 w-8 h-8 rounded-full flex items-center justify-center transform -translate-x-1/2 transition-all hover:scale-110 ${
                    interaction.enabled
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}
                  style={{ left: `${position}%` }}
                  onClick={() => setEditingId(interaction.id)}
                  title={`${interaction.title} at ${formatTime(interaction.triggerTime)}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Time markers */}
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>0:00</span>
            <span>{formatTime(Math.floor(videoDuration / 4))}</span>
            <span>{formatTime(Math.floor(videoDuration / 2))}</span>
            <span>{formatTime(Math.floor((videoDuration * 3) / 4))}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
        </div>
      </Card>

      {/* Interactions list */}
      <div className="space-y-4">
        {interactions.length === 0 ? (
          <Card variant="raised" padding="lg">
            <div className="text-center py-8 text-text-secondary">
              <p>No interactions yet.</p>
              <p className="text-sm mt-1">Add polls, CTAs, and more to engage your viewers.</p>
            </div>
          </Card>
        ) : (
          interactions
            .sort((a, b) => a.triggerTime - b.triggerTime)
            .map((interaction) => {
              const Icon = getInteractionIcon(interaction.type)
              const isEditing = editingId === interaction.id

              return (
                <Card
                  key={interaction.id}
                  variant="raised"
                  padding="md"
                  className={`${
                    !interaction.enabled ? 'opacity-60' : ''
                  } ${isEditing ? 'ring-2 ring-primary-500' : ''}`}
                >
                  {isEditing ? (
                    <InteractionEditForm
                      interaction={interaction}
                      onSave={handleUpdateInteraction}
                      onCancel={() => setEditingId(null)}
                      isSaving={isSaving}
                      videoDuration={videoDuration}
                    />
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-text-primary truncate">
                            {interaction.title}
                          </h3>
                          <span className="text-xs bg-neu-dark px-2 py-0.5 rounded">
                            {interaction.type}
                          </span>
                          {!interaction.enabled && (
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-1">
                          Appears at {formatTime(interaction.triggerTime)}
                          {interaction.duration && ` • ${interaction.duration}s duration`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(interaction.id)}
                          className="p-2 text-text-secondary hover:text-primary-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInteraction(interaction.id)}
                          className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
        )}
      </div>

      {/* Add interaction modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Interaction</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Interaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERACTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setNewInteraction({ ...newInteraction, type: type.value, config: {} })
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        newInteraction.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className="w-5 h-5 text-primary-500" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-text-muted">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic fields */}
              <Input
                label="Title"
                value={newInteraction.title || ''}
                onChange={(e) =>
                  setNewInteraction({ ...newInteraction, title: e.target.value })
                }
                placeholder="e.g., Quick poll: Your experience level?"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Trigger Time (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={formatTime(newInteraction.triggerTime || 0)}
                    onChange={(e) =>
                      setNewInteraction({
                        ...newInteraction,
                        triggerTime: parseTime(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Position
                  </label>
                  <select
                    value={newInteraction.position || 'BOTTOM_RIGHT'}
                    onChange={(e) =>
                      setNewInteraction({ ...newInteraction, position: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type-specific config */}
              <InteractionConfigFields
                type={newInteraction.type || 'POLL'}
                config={newInteraction.config || {}}
                onChange={(config) => setNewInteraction({ ...newInteraction, config })}
              />

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newInteraction.pauseVideo || false}
                    onChange={(e) =>
                      setNewInteraction({ ...newInteraction, pauseVideo: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Pause video when shown</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newInteraction.showOnReplay !== false}
                    onChange={(e) =>
                      setNewInteraction({ ...newInteraction, showOnReplay: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Show on replay</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInteraction} loading={isSaving}>
                Add Interaction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InteractionConfigFields({
  type,
  config,
  onChange,
}: {
  type: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}) {
  const [options, setOptions] = useState<string[]>((config.options as string[]) || ['', ''])

  const updateOptions = (newOptions: string[]) => {
    setOptions(newOptions)
    onChange({ ...config, options: newOptions })
  }

  switch (type) {
    case 'POLL':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Poll Options
          </label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...options]
                  newOptions[index] = e.target.value
                  updateOptions(newOptions)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  onClick={() => updateOptions(options.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              onClick={() => updateOptions([...options, ''])}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              + Add option
            </button>
          )}
        </div>
      )

    case 'CTA':
    case 'SPECIAL_OFFER':
      return (
        <div className="space-y-4">
          <Input
            label="Button Text"
            value={(config.buttonText as string) || ''}
            onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
            placeholder="e.g., Learn More"
          />
          <Input
            label="Button URL"
            value={(config.buttonUrl as string) || ''}
            onChange={(e) => onChange({ ...config, buttonUrl: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Description (optional)"
            value={(config.description as string) || ''}
            onChange={(e) => onChange({ ...config, description: e.target.value })}
            placeholder="Brief description..."
          />
        </div>
      )

    case 'DOWNLOAD':
      return (
        <div className="space-y-4">
          <Input
            label="Download URL"
            value={(config.downloadUrl as string) || ''}
            onChange={(e) => onChange({ ...config, downloadUrl: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="File Name"
            value={(config.fileName as string) || ''}
            onChange={(e) => onChange({ ...config, fileName: e.target.value })}
            placeholder="e.g., Cheatsheet.pdf"
          />
          <Input
            label="Description (optional)"
            value={(config.description as string) || ''}
            onChange={(e) => onChange({ ...config, description: e.target.value })}
            placeholder="Brief description..."
          />
        </div>
      )

    case 'TIP':
    case 'QUESTION':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Description
          </label>
          <textarea
            value={(config.description as string) || ''}
            onChange={(e) => onChange({ ...config, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Enter the content..."
          />
        </div>
      )

    case 'FEEDBACK':
      return (
        <p className="text-sm text-text-secondary">
          Feedback interactions show thumbs up/down/neutral options automatically.
        </p>
      )

    default:
      return null
  }
}

function InteractionEditForm({
  interaction,
  onSave,
  onCancel,
  isSaving,
  videoDuration,
}: {
  interaction: Interaction
  onSave: (interaction: Interaction) => void
  onCancel: () => void
  isSaving: boolean
  videoDuration: number
}) {
  const [edited, setEdited] = useState(interaction)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return parseInt(timeStr) || 0
  }

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        value={edited.title}
        onChange={(e) => setEdited({ ...edited, title: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Trigger Time
          </label>
          <input
            type="text"
            value={formatTime(edited.triggerTime)}
            onChange={(e) =>
              setEdited({ ...edited, triggerTime: parseTime(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Position
          </label>
          <select
            value={edited.position}
            onChange={(e) => setEdited({ ...edited, position: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <InteractionConfigFields
        type={edited.type}
        config={edited.config}
        onChange={(config) => setEdited({ ...edited, config })}
      />

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={edited.enabled}
            onChange={(e) => setEdited({ ...edited, enabled: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Enabled</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={edited.pauseVideo}
            onChange={(e) => setEdited({ ...edited, pauseVideo: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Pause video</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={edited.showOnReplay}
            onChange={(e) => setEdited({ ...edited, showOnReplay: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Show on replay</span>
        </label>
      </div>

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
