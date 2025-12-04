/**
 * Interaction List Item Component
 *
 * Displays a single interaction in the list with edit/delete actions
 */

'use client'

import { Card } from '@/components/ui/Card'
import { Edit2, Trash2 } from 'lucide-react'
import { getInteractionIcon } from '../lib/interactionTypes'
import { formatTime } from '@/lib'
import type { Interaction } from '../lib/interactionTypes'

interface InteractionListItemProps {
  interaction: Interaction
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
  onHover: (id: string | null) => void
  editForm?: React.ReactNode
}

export function InteractionListItem({
  interaction,
  isEditing,
  onEdit,
  onDelete,
  onHover,
  editForm,
}: InteractionListItemProps) {
  const Icon = getInteractionIcon(interaction.type)

  return (
    <Card
      variant="raised"
      padding="md"
      className={`${!interaction.enabled ? 'opacity-60' : ''} ${
        isEditing ? 'ring-2 ring-primary-500' : ''
      }`}
      onMouseEnter={() => onHover(interaction.id)}
      onMouseLeave={() => onHover(null)}
    >
      {isEditing ? (
        editForm
      ) : (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary truncate">{interaction.title}</h3>
              <span className="text-xs bg-neu-dark px-2 py-0.5 rounded">{interaction.type}</span>
              {!interaction.enabled && (
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Disabled</span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Appears at {formatTime(interaction.triggerTime)}
              {interaction.duration && ` • ${interaction.duration}s duration`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-text-secondary hover:text-primary-500 transition-colors"
              title="Edit interaction"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-text-secondary hover:text-red-500 transition-colors"
              title="Delete interaction"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
