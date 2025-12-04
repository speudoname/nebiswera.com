/**
 * FilterTabs Component
 *
 * Tab controls for filtering between all items, chat only, or widgets only
 */

'use client'

import { MessageCircle, Zap } from 'lucide-react'
import type { FilterType } from '../../hooks/useFeedItems'

interface FilterTabsProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function FilterTabs({ filter, onFilterChange }: FilterTabsProps) {
  return (
    <div className="flex items-center border-b border-gray-200 bg-white">
      <button
        onClick={() => onFilterChange('all')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          filter === 'all'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        All
      </button>
      <button
        onClick={() => onFilterChange('chat')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          filter === 'chat'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <MessageCircle className="w-4 h-4" />
        Chat
      </button>
      <button
        onClick={() => onFilterChange('widgets')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          filter === 'widgets'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Zap className="w-4 h-4" />
        Widgets
      </button>
    </div>
  )
}
