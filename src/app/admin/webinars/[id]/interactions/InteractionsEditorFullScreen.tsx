'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { VideoTimelineEditor } from './VideoTimelineEditor'
import { InteractionsSidebar } from './InteractionsSidebar'
import { DEFAULT_INTERACTION } from './constants'
import { formatTime, parseTime, validateInteraction, detectConflicts, debounce } from './utils'
import { Toast, ToastProps } from './Toast'
import { ConfirmDialog, ConfirmDialogProps } from './ConfirmDialog'
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
  Pause,
  HelpCircle,
  UserPlus,
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
  videoUrl: string
  videoDuration: number
  initialInteractions: Interaction[]
}

const INTERACTION_TYPES = [
  { value: 'POLL', label: 'Poll', icon: BarChart2, description: 'Multiple choice question' },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle, description: 'Quiz with correct answers' },
  { value: 'CTA', label: 'Call to Action', icon: MousePointer, description: 'Button with link' },
  { value: 'DOWNLOAD', label: 'Download', icon: Download, description: 'Downloadable resource' },
  { value: 'QUESTION', label: 'Question', icon: MessageSquare, description: 'Open-ended Q&A' },
  { value: 'FEEDBACK', label: 'Feedback', icon: ThumbsUp, description: 'Rating/emoji feedback' },
  { value: 'CONTACT_FORM', label: 'Contact Form', icon: UserPlus, description: 'Lead capture form' },
  { value: 'TIP', label: 'Tip', icon: Lightbulb, description: 'Info tooltip' },
  { value: 'SPECIAL_OFFER', label: 'Special Offer', icon: Gift, description: 'Timed offer' },
  { value: 'PAUSE', label: 'Pause', icon: Pause, description: 'Pause video temporarily' },
]

export function InteractionsEditorFullScreen({
  webinarId,
  videoUrl,
  videoDuration,
  initialInteractions,
}: InteractionsEditorProps) {
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [typeConfirmed, setTypeConfirmed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [hoveredInteractionId, setHoveredInteractionId] = useState<string | null>(null)
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  // Toast and Dialog state
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'> & {
    onConfirm: () => void
  } | null>(null)

  // New interaction form state
  const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>(DEFAULT_INTERACTION)

  const clearSelectionState = useCallback(() => {
    setEditingId(null)
    setSelectedInteractionId(null)
    setHoveredInteractionId(null)
  }, [])

  // Real-time validation when newInteraction changes
  useEffect(() => {
    if (showAddModal && typeConfirmed && newInteraction.title) {
      const errors = validateInteraction(newInteraction, videoDuration)
      const warnings = detectConflicts(newInteraction, interactions)
      setValidationErrors(errors)
      setValidationWarnings(warnings)
    } else if (!showAddModal) {
      // Clear validation when modal closes
      setValidationErrors([])
      setValidationWarnings([])
    }
  }, [newInteraction, showAddModal, typeConfirmed, videoDuration, interactions])

  const handleAddInteraction = async () => {
    // Validate the interaction
    const errors = validateInteraction(newInteraction, videoDuration)
    const warnings = detectConflicts(newInteraction, interactions)

    setValidationErrors(errors)
    setValidationWarnings(warnings)

    // Block if there are errors
    if (errors.length > 0) {
      return
    }

    // Show confirmation if there are warnings
    if (warnings.length > 0) {
      setConfirmDialog({
        title: 'Timing Conflict Warning',
        message: warnings,
        confirmText: 'Add Anyway',
        variant: 'warning',
        onConfirm: () => {
          setConfirmDialog(null)
          performAddInteraction()
        },
      })
      return
    }

    performAddInteraction()
  }

  const performAddInteraction = useCallback(async () => {
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
      setTypeConfirmed(false)
      clearSelectionState()
      setNewInteraction(DEFAULT_INTERACTION)
      setValidationErrors([])
      setValidationWarnings([])
      setToast({ message: 'Interaction added!', type: 'success' })
    } catch (error) {
      console.error(error)
      setToast({ message: 'Failed to create interaction', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }, [webinarId, newInteraction, interactions, clearSelectionState])

  const handleUpdateInteraction = async (interaction: Interaction) => {
    // Validate the interaction
    const errors = validateInteraction(interaction, videoDuration)
    const warnings = detectConflicts(interaction, interactions)

    // Block if there are errors
    if (errors.length > 0) {
      setToast({ message: errors[0], type: 'error' })
      return
    }

    // Show confirmation if there are warnings
    if (warnings.length > 0) {
      setConfirmDialog({
        title: 'Timing Conflict Warning',
        message: warnings,
        confirmText: 'Save Anyway',
        variant: 'warning',
        onConfirm: () => {
          setConfirmDialog(null)
          performUpdateInteraction(interaction)
        },
      })
      return
    }

    performUpdateInteraction(interaction)
  }

  const performUpdateInteraction = useCallback(async (interaction: Interaction) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${interaction.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interaction),
        }
      )

      if (!response.ok) throw new Error('Failed to update interaction')

      const data = await response.json()
      setInteractions(
        interactions.map((i) => (i.id === interaction.id ? data.interaction : i))
      )
      clearSelectionState()
      setToast({ message: 'Interaction updated!', type: 'success' })
    } catch (error) {
      console.error(error)
      setToast({ message: 'Failed to update interaction', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }, [webinarId, interactions, clearSelectionState])

  const handleDeleteInteraction = async (id: string) => {
    setConfirmDialog({
      title: 'Delete Interaction',
      message: 'Are you sure you want to delete this interaction? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        setConfirmDialog(null)
        performDeleteInteraction(id)
      },
    })
  }

  const performDeleteInteraction = useCallback(async (id: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/interactions/${id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete interaction')

      setInteractions(interactions.filter((i) => i.id !== id))
      setToast({ message: 'Interaction deleted!', type: 'success' })
    } catch (error) {
      console.error(error)
      setToast({ message: 'Failed to delete interaction', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }, [webinarId, interactions])

  const getInteractionIcon = (type: string) => {
    const iconType = INTERACTION_TYPES.find((t) => t.value === type)
    return iconType?.icon || BarChart2
  }

  const handleDuplicateInteraction = useCallback((interaction: Interaction) => {
    const duplicate: Partial<Interaction> = {
      ...interaction,
      id: undefined, // Remove ID so new one is created
      title: `${interaction.title} (Copy)`,
      triggerTime: Math.min(interaction.triggerTime + 5, videoDuration),
    }

    // Open add modal with pre-filled data
    setNewInteraction(duplicate)
    setTypeConfirmed(true)
    setShowAddModal(true)
  }, [videoDuration])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case 'Escape':
          if (showAddModal || editingId) {
            setShowAddModal(false)
            setTypeConfirmed(false)
            clearSelectionState()
          }
          break

        case 'Delete':
        case 'Backspace':
          if (selectedInteractionId && !showAddModal && !editingId) {
            e.preventDefault()
            handleDeleteInteraction(selectedInteractionId)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedInteractionId, showAddModal, editingId, clearSelectionState, handleDeleteInteraction])

  // Debounced API update for interaction move (optimistic UI update is instant)
  const debouncedInteractionMove = useMemo(
    () =>
      debounce(async (id: string, newTime: number) => {
        try {
          const response = await fetch(`/api/admin/webinars/${webinarId}/interactions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ triggerTime: newTime }),
          })

          if (!response.ok) {
            throw new Error('Failed to update interaction')
          }
        } catch (error) {
          console.error(error)
          setToast({ message: 'Failed to update interaction position', type: 'error' })
        }
      }, 500),
    [webinarId]
  )

  return (
    <div className="h-full flex overflow-hidden">
      {/* Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Left: Video + Timeline (2/3) */}
      <div className="flex-1 flex flex-col p-2 min-h-0">
        {/* Video Timeline Editor */}
        {videoUrl && (
          <VideoTimelineEditor
            videoUrl={videoUrl}
            videoDuration={videoDuration}
            interactions={interactions}
            onCurrentTimeChange={setCurrentTime}
            highlightedInteractionId={hoveredInteractionId || selectedInteractionId}
            onInteractionHover={setHoveredInteractionId}
            onInteractionClick={(interaction) => {
              setSelectedInteractionId(interaction.id)
              setEditingId(interaction.id)
            }}
            onInteractionMove={(id, newTime) => {
              // Optimistically update UI (instant)
              setInteractions(
                interactions.map((i) => (i.id === id ? { ...i, triggerTime: newTime } : i))
              )

              // Debounced API call (500ms delay)
              debouncedInteractionMove(id, newTime)
            }}
            onAddInteraction={(time) => {
              setNewInteraction({ ...newInteraction, triggerTime: time })
              setShowAddModal(true)
            }}
            onDeleteInteraction={handleDeleteInteraction}
          />
        )}
      </div>

      {/* Right: Interactions Sidebar (1/3) */}
      <div className="w-96 flex-shrink-0">
        <InteractionsSidebar
          interactions={interactions}
          highlightedInteractionId={hoveredInteractionId || selectedInteractionId}
          onInteractionHover={setHoveredInteractionId}
          onInteractionSelect={setSelectedInteractionId}
          onAdd={() => {
            setNewInteraction({ ...newInteraction, triggerTime: Math.floor(currentTime) })
            setShowAddModal(true)
          }}
          onEdit={(interaction) => setEditingId(interaction.id)}
          onDelete={handleDeleteInteraction}
          onDuplicate={handleDuplicateInteraction}
          onToggleEnabled={async (id, enabled) => {
            const interaction = interactions.find((i) => i.id === id)
            if (!interaction) return

            // Optimistically update UI
            setInteractions(
              interactions.map((i) => (i.id === id ? { ...i, enabled } : i))
            )

            setIsSaving(true)
            try {
              const response = await fetch(
                `/api/admin/webinars/${webinarId}/interactions/${id}`,
                {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enabled }),
                }
              )

              if (!response.ok) {
                // Revert on error
                setInteractions(
                  interactions.map((i) => (i.id === id ? { ...i, enabled: !enabled } : i))
                )
                throw new Error('Failed to update interaction')
              }
            } catch (error) {
              console.error(error)
              setToast({ message: 'Failed to toggle interaction', type: 'error' })
            } finally {
              setIsSaving(false)
            }
          }}
        />
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Interaction</h2>
              <button
                onClick={clearSelectionState}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <InteractionEditForm
                interaction={interactions.find(i => i.id === editingId)!}
                onSave={handleUpdateInteraction}
                onCancel={clearSelectionState}
                isSaving={isSaving}
                videoDuration={videoDuration}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add interaction modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Interaction</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setTypeConfirmed(false)
                  clearSelectionState()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!typeConfirmed ? (
                /* Step 1: Type selection only */
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Choose Interaction Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {INTERACTION_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            setNewInteraction({ ...newInteraction, type: type.value, config: {} })
                            setTypeConfirmed(true)
                          }}
                          className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                        >
                          <type.icon className="w-6 h-6 text-primary-500" />
                          <div>
                            <p className="font-medium text-sm">{type.label}</p>
                            <p className="text-xs text-text-muted">{type.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Step 2: Form fields after type selection */
                <>
                  {/* Selected Type Header with Change Button */}
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const selectedType = INTERACTION_TYPES.find(t => t.value === newInteraction.type)
                        const Icon = selectedType?.icon || BarChart2
                        return (
                          <>
                            <Icon className="w-5 h-5 text-primary-500" />
                            <div>
                              <p className="font-medium text-sm">{selectedType?.label}</p>
                              <p className="text-xs text-text-muted">{selectedType?.description}</p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    <button
                      onClick={() => setTypeConfirmed(false)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Change Type
                    </button>
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

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, i) => (
                          <li key={i} className="text-sm text-red-700">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Warnings */}
                  {validationWarnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-amber-800 mb-1">Warnings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationWarnings.map((warning, i) => (
                          <li key={i} className="text-sm text-amber-700">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false)
                  setTypeConfirmed(false)
                  clearSelectionState()
                }}
              >
                Cancel
              </Button>
              {typeConfirmed && (
                <Button onClick={handleAddInteraction} loading={isSaving}>
                  Add Interaction
                </Button>
              )}
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

    case 'QUIZ': {
      const [quizOptions, setQuizOptions] = useState<string[]>(
        (config.options as string[]) || ['', '']
      )
      const [correctAnswers, setCorrectAnswers] = useState<number[]>(
        (config.correctAnswers as number[]) || []
      )

      const updateQuizOptions = (newOptions: string[]) => {
        setQuizOptions(newOptions)
        onChange({ ...config, options: newOptions, correctAnswers })
      }

      const toggleCorrectAnswer = (index: number) => {
        const newCorrect = correctAnswers.includes(index)
          ? correctAnswers.filter((i) => i !== index)
          : [...correctAnswers, index]
        setCorrectAnswers(newCorrect)
        onChange({ ...config, options: quizOptions, correctAnswers: newCorrect })
      }

      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Quiz Options (check the correct answer)
          </label>
          {quizOptions.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={correctAnswers.includes(index)}
                onChange={() => toggleCorrectAnswer(index)}
                className="rounded"
                title="Mark as correct answer"
              />
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...quizOptions]
                  newOptions[index] = e.target.value
                  updateQuizOptions(newOptions)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={`Option ${index + 1}`}
              />
              {quizOptions.length > 2 && (
                <button
                  onClick={() => updateQuizOptions(quizOptions.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {quizOptions.length < 6 && (
            <button
              onClick={() => updateQuizOptions([...quizOptions, ''])}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              + Add option
            </button>
          )}
          <p className="text-xs text-text-muted mt-2">
            Check the box next to the correct answer(s)
          </p>
        </div>
      )
    }

    case 'CONTACT_FORM':
      return (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Contact forms collect name and email by default.
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(config.collectPhone as boolean) || false}
                onChange={(e) => onChange({ ...config, collectPhone: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Collect phone number</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(config.collectCompany as boolean) || false}
                onChange={(e) => onChange({ ...config, collectCompany: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Collect company name</span>
            </label>
          </div>
          <Input
            label="Success Message (optional)"
            value={(config.successMessage as string) || ''}
            onChange={(e) => onChange({ ...config, successMessage: e.target.value })}
            placeholder="Thanks! We'll be in touch soon."
          />
        </div>
      )

    case 'PAUSE':
      return (
        <div className="space-y-4">
          <Input
            label="Pause Message"
            value={(config.message as string) || ''}
            onChange={(e) => onChange({ ...config, message: e.target.value })}
            placeholder="e.g., Take a moment to reflect..."
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Auto-resume after (seconds)
            </label>
            <input
              type="number"
              value={(config.autoResumeDuration as number) || 0}
              onChange={(e) =>
                onChange({ ...config, autoResumeDuration: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0 = manual resume"
              min="0"
            />
            <p className="text-xs text-text-muted mt-1">
              Set to 0 to require manual resume button click
            </p>
          </div>
        </div>
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

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        value={edited.title}
        onChange={(e) => setEdited({ ...edited, title: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Trigger Time (mm:ss)
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
