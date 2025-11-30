'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  BarChart2,
  MousePointer,
  Download,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Gift,
  HelpCircle,
  UserPlus,
  Pause as PauseIcon,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Plus,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

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

interface InteractionsSidebarProps {
  interactions: Interaction[]
  highlightedInteractionId: string | null
  onInteractionHover: (id: string | null) => void
  onInteractionSelect: (id: string) => void
  onAdd: () => void
  onEdit: (interaction: Interaction) => void
  onDelete: (id: string) => void
  onDuplicate: (interaction: Interaction) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
}

const INTERACTION_ICONS: Record<string, any> = {
  POLL: BarChart2,
  QUIZ: HelpCircle,
  CTA: MousePointer,
  DOWNLOAD: Download,
  QUESTION: MessageSquare,
  FEEDBACK: ThumbsUp,
  CONTACT_FORM: UserPlus,
  TIP: Lightbulb,
  SPECIAL_OFFER: Gift,
  PAUSE: PauseIcon,
}

const INTERACTION_COLORS: Record<string, string> = {
  POLL: '#3B82F6',
  QUIZ: '#A855F7',
  CTA: '#10B981',
  DOWNLOAD: '#F97316',
  QUESTION: '#EC4899',
  FEEDBACK: '#EAB308',
  CONTACT_FORM: '#6366F1',
  TIP: '#14B8A6',
  SPECIAL_OFFER: '#EF4444',
  PAUSE: '#6B7280',
}

export function InteractionsSidebar({
  interactions,
  highlightedInteractionId,
  onInteractionHover,
  onInteractionSelect,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
}: InteractionsSidebarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sortedInteractions = [...interactions].sort((a, b) => a.triggerTime - b.triggerTime)

  // Auto-scroll to highlighted interaction
  useEffect(() => {
    if (highlightedInteractionId && cardRefs.current.has(highlightedInteractionId)) {
      const element = cardRefs.current.get(highlightedInteractionId)
      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [highlightedInteractionId])

  return (
    <div className="h-full flex flex-col bg-white border-l border-neu-dark">
      {/* Header */}
      <div className="p-4 border-b border-neu-dark">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Interactions ({interactions.length})</h3>
          <Button onClick={onAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Timeline Interactions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedInteractions.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <div className="mb-3">
              <MessageSquare className="w-12 h-12 mx-auto opacity-20" />
            </div>
            <p className="font-medium">No interactions yet</p>
            <p className="text-xs mt-1">Add polls, CTAs, and more to engage viewers</p>
            <Button onClick={onAdd} className="mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add First Interaction
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {sortedInteractions.map((interaction, index) => (
              <div key={interaction.id} className="relative mb-6">
                {/* Timeline Dot */}
                <div
                  className="absolute left-6 top-8 w-3 h-3 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2"
                  style={{ backgroundColor: INTERACTION_COLORS[interaction.type] || '#6B7280' }}
                />

                {/* Interaction Card */}
                <InteractionPreviewCard
                  ref={(el) => {
                    if (el) {
                      cardRefs.current.set(interaction.id, el)
                    } else {
                      cardRefs.current.delete(interaction.id)
                    }
                  }}
                  interaction={interaction}
                  index={index + 1}
                  isHighlighted={highlightedInteractionId === interaction.id}
                  onHover={() => onInteractionHover(interaction.id)}
                  onHoverEnd={() => onInteractionHover(null)}
                  onClick={() => onInteractionSelect(interaction.id)}
                  onEdit={() => onEdit(interaction)}
                  onDelete={() => onDelete(interaction.id)}
                  onDuplicate={() => onDuplicate(interaction)}
                  onToggleEnabled={() => onToggleEnabled(interaction.id, !interaction.enabled)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const InteractionPreviewCard = React.forwardRef<HTMLDivElement, {
  interaction: Interaction
  index: number
  isHighlighted: boolean
  onHover: () => void
  onHoverEnd: () => void
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleEnabled: () => void
}>(({
  interaction,
  index,
  isHighlighted,
  onHover,
  onHoverEnd,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
}, ref) => {
  const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare
  const color = INTERACTION_COLORS[interaction.type] || '#6B7280'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={ref}
      className="ml-12"
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {/* Timestamp */}
      <div className="text-xs font-medium text-gray-500 mb-2">
        {formatTime(interaction.triggerTime)}
      </div>

      {/* Card */}
      <div
        onClick={onClick}
        className={`rounded-lg border-2 transition-all cursor-pointer ${
          isHighlighted
            ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]'
            : interaction.enabled
            ? 'border-gray-200 bg-white hover:border-gray-300'
            : 'border-gray-100 bg-gray-50 opacity-60'
        }`}
        style={isHighlighted ? { boxShadow: `0 0 0 3px ${color}20` } : undefined}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-100 flex items-start gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{interaction.title}</h4>
              <span className="text-xs text-text-secondary">{interaction.type}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggleEnabled}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title={interaction.enabled ? 'Disable' : 'Enable'}
            >
              {interaction.enabled ? (
                <Eye className="w-4 h-4 text-gray-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
              className="p-1.5 hover:bg-blue-50 rounded transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-3">
          <InteractionPreview interaction={interaction} />
        </div>
      </div>
    </div>
  )
})

InteractionPreviewCard.displayName = 'InteractionPreviewCard'

function InteractionPreview({ interaction }: { interaction: Interaction }) {
  const config = interaction.config

  switch (interaction.type) {
    case 'POLL':
    case 'QUIZ':
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-primary">{interaction.title}</p>
          <div className="space-y-1.5">
            {((config.options as string[]) || []).map((option, index) => (
              <div
                key={index}
                className="px-3 py-2 bg-gray-50 rounded text-xs border border-gray-200"
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )

    case 'CTA':
    case 'SPECIAL_OFFER':
      return (
        <div className="space-y-2">
          {config.description && typeof config.description === 'string' ? (
            <p className="text-xs text-text-secondary">{config.description}</p>
          ) : null}
          <button className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">
            {(config.buttonText as string) || 'Learn More'}
          </button>
        </div>
      )

    case 'DOWNLOAD':
      return (
        <div className="space-y-2">
          {config.description && typeof config.description === 'string' ? (
            <p className="text-xs text-text-secondary">{config.description}</p>
          ) : null}
          <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            {(config.fileName as string) || 'Download'}
          </button>
        </div>
      )

    case 'FEEDBACK':
      return (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">How would you rate this?</p>
          <div className="flex justify-center gap-3">
            <button className="p-2 bg-green-50 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </button>
            <button className="p-2 bg-yellow-50 rounded-lg">
              <span className="text-lg">😐</span>
            </button>
            <button className="p-2 bg-red-50 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-red-600 rotate-180" />
            </button>
          </div>
        </div>
      )

    case 'TIP':
      return (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            {(config.description as string) || interaction.title}
          </p>
        </div>
      )

    case 'QUESTION':
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-primary">{interaction.title}</p>
          <textarea
            className="w-full px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs"
            rows={2}
            placeholder={(config.placeholder as string) || 'Type your answer...'}
            disabled
          />
        </div>
      )

    case 'CONTACT_FORM':
      return (
        <div className="space-y-2">
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs"
            placeholder="Full Name *"
            disabled
          />
          <input
            type="email"
            className="w-full px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs"
            placeholder="Email Address *"
            disabled
          />
          {config.collectPhone ? (
            <input
              type="tel"
              className="w-full px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs"
              placeholder="Phone Number"
              disabled
            />
          ) : null}
          {config.collectCompany ? (
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs"
              placeholder="Company Name"
              disabled
            />
          ) : null}
        </div>
      )

    case 'PAUSE':
      return (
        <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
          <PauseIcon className="w-4 h-4 text-gray-600" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">
              {(config.message as string) || 'Video paused'}
            </p>
            {config.autoResumeDuration ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Auto-resumes in {String(config.autoResumeDuration)}s
              </p>
            ) : null}
          </div>
        </div>
      )

    default:
      return (
        <div className="text-xs text-text-secondary">
          Preview not available for {interaction.type}
        </div>
      )
  }
}
