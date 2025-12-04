/**
 * Interaction Modal Component
 *
 * Universal modal for adding and editing interactions
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import { formatTime, parseTime } from '@/lib'
import { INTERACTION_TYPES, POSITIONS, type Interaction } from '../lib/interactionTypes'
import { InteractionConfigFields } from './interaction-configs'

interface InteractionModalProps {
  mode: 'add' | 'edit'
  interaction: Partial<Interaction>
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSave: (interaction: Partial<Interaction>) => void
}

export function InteractionModal({
  mode,
  interaction: initialInteraction,
  isOpen,
  isLoading,
  onClose,
  onSave,
}: InteractionModalProps) {
  const [interaction, setInteraction] = useState<Partial<Interaction>>(initialInteraction)

  // Update local state when prop changes
  useEffect(() => {
    setInteraction(initialInteraction)
  }, [initialInteraction])

  if (!isOpen) return null

  const handleSave = () => {
    if (!interaction.title || !interaction.type) {
      alert('Please fill in all required fields')
      return
    }
    onSave(interaction)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'add' ? 'Add Interaction' : 'Edit Interaction'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
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
                  onClick={() => setInteraction({ ...interaction, type: type.value, config: {} })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    interaction.type === type.value
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

          {/* Title */}
          <Input
            label="Title"
            value={interaction.title || ''}
            onChange={(e) => setInteraction({ ...interaction, title: e.target.value })}
            placeholder="e.g., Quick poll: Your experience level?"
          />

          {/* Trigger Time & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Trigger Time (mm:ss)
              </label>
              <input
                type="text"
                value={formatTime(interaction.triggerTime || 0)}
                onChange={(e) =>
                  setInteraction({
                    ...interaction,
                    triggerTime: parseTime(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Position</label>
              <select
                value={interaction.position || 'BOTTOM_RIGHT'}
                onChange={(e) => setInteraction({ ...interaction, position: e.target.value })}
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
            type={interaction.type || 'POLL'}
            config={interaction.config || {}}
            onChange={(config) => setInteraction({ ...interaction, config })}
          />

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={interaction.pauseVideo || false}
                onChange={(e) => setInteraction({ ...interaction, pauseVideo: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Pause video when shown</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={interaction.showOnReplay !== false}
                onChange={(e) =>
                  setInteraction({ ...interaction, showOnReplay: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Show on replay</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isLoading}>
            {mode === 'add' ? 'Add Interaction' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
