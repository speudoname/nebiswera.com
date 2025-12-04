/**
 * Interaction List Component
 *
 * Renders the list of interactions sorted by trigger time
 */

'use client'

import { Card } from '@/components/ui/Card'
import { InteractionListItem } from './InteractionListItem'
import type { Interaction } from '../lib/interactionTypes'

interface InteractionListProps {
  interactions: Interaction[]
  editingId: string | null
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onHover: (id: string | null) => void
  renderEditForm: (interaction: Interaction) => React.ReactNode
}

export function InteractionList({
  interactions,
  editingId,
  onEdit,
  onDelete,
  onHover,
  renderEditForm,
}: InteractionListProps) {
  // Empty state
  if (interactions.length === 0) {
    return (
      <Card variant="raised" padding="lg">
        <div className="text-center py-8 text-text-secondary">
          <p>No interactions yet.</p>
          <p className="text-sm mt-1">Add polls, CTAs, and more to engage your viewers.</p>
        </div>
      </Card>
    )
  }

  // Sort by trigger time and render
  const sortedInteractions = [...interactions].sort((a, b) => a.triggerTime - b.triggerTime)

  return (
    <div className="space-y-4">
      {sortedInteractions.map((interaction) => (
        <InteractionListItem
          key={interaction.id}
          interaction={interaction}
          isEditing={editingId === interaction.id}
          onEdit={() => onEdit(interaction.id)}
          onDelete={() => onDelete(interaction.id)}
          onHover={onHover}
          editForm={editingId === interaction.id ? renderEditForm(interaction) : undefined}
        />
      ))}
    </div>
  )
}
