'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { VideoTimelineEditor } from './VideoTimelineEditor'
import { Plus, Save } from 'lucide-react'

// Import shared utilities
import { formatTime, parseTime } from '@/lib'
import { POSITIONS, type Interaction } from './lib/interactionTypes'
import { getDefaultInteraction } from './lib/interactionDefaults'
import { useInteractionAPI } from './hooks/useInteractionAPI'
import { InteractionConfigFields } from './components/interaction-configs'
import { InteractionList } from './components/InteractionList'
import { InteractionModal } from './components/InteractionModal'

interface InteractionsEditorProps {
  webinarId: string
  videoUrl: string
  videoDuration: number
  initialInteractions: Interaction[]
}

export function InteractionsEditor({
  webinarId,
  videoUrl,
  videoDuration,
  initialInteractions,
}: InteractionsEditorProps) {
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [hoveredInteractionId, setHoveredInteractionId] = useState<string | null>(null)

  // New interaction form state - using shared defaults
  const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>(
    getDefaultInteraction()
  )

  // Use API hook for all interaction operations
  const api = useInteractionAPI({
    webinarId,
    onSuccess: (message) => {
      setSaveMessage(message)
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const handleUpdateInteraction = async (interaction: Interaction) => {
    const result = await api.updateInteraction(interaction)
    if (result) {
      setInteractions(
        interactions.map((i) => (i.id === interaction.id ? result : i))
      )
      setEditingId(null)
    }
  }

  const handleDeleteInteraction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) return

    const success = await api.deleteInteraction(id)
    if (success) {
      setInteractions(interactions.filter((i) => i.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Save message */}
      {saveMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
          {saveMessage}
        </div>
      )}

      {/* Video Timeline Editor */}
      {videoUrl && (
        <VideoTimelineEditor
          videoUrl={videoUrl}
          videoDuration={videoDuration}
          interactions={interactions}
          highlightedInteractionId={hoveredInteractionId}
          onInteractionHover={setHoveredInteractionId}
          onInteractionClick={(interaction) => setEditingId(interaction.id)}
          onInteractionMove={async (id, newTime) => {
            const success = await api.moveInteraction(id, newTime, interactions)
            if (success) {
              setInteractions(
                interactions.map((i) => (i.id === id ? { ...i, triggerTime: newTime } : i))
              )
            }
          }}
          onAddInteraction={(time) => {
            setNewInteraction({ ...newInteraction, triggerTime: time })
            setShowAddModal(true)
          }}
          onDeleteInteraction={handleDeleteInteraction}
        />
      )}

      {/* Add Interaction Button */}
      <div className="flex justify-center">
        <Button onClick={() => setShowAddModal(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Interaction
        </Button>
      </div>

      {/* Interactions list */}
      <InteractionList
        interactions={interactions}
        editingId={editingId}
        onEdit={setEditingId}
        onDelete={handleDeleteInteraction}
        onHover={setHoveredInteractionId}
        renderEditForm={(interaction) => (
          <InteractionEditForm
            interaction={interaction}
            onSave={handleUpdateInteraction}
            onCancel={() => setEditingId(null)}
            isSaving={api.isLoading}
            videoDuration={videoDuration}
          />
        )}
      />

      {/* Add interaction modal */}
      <InteractionModal
        mode="add"
        interaction={newInteraction}
        isOpen={showAddModal}
        isLoading={api.isLoading}
        onClose={() => setShowAddModal(false)}
        onSave={async (interaction) => {
          const result = await api.addInteraction(interaction)
          if (result) {
            setInteractions([...interactions, result])
            setShowAddModal(false)
            setNewInteraction(getDefaultInteraction())
          }
        }}
      />
    </div>
  )
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
