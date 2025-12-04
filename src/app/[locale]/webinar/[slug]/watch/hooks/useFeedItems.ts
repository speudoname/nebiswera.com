/**
 * useFeedItems Hook
 *
 * Merges chat messages and interactions into a unified, sorted feed
 */

'use client'

import { useMemo } from 'react'
import type { ChatMessage } from './useAblyChat'

export interface InteractionData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: Record<string, unknown>
}

export type FeedItem =
  | { type: 'chat'; data: ChatMessage }
  | { type: 'interaction'; data: InteractionData }

export type FilterType = 'all' | 'chat' | 'widgets'

interface UseFeedItemsParams {
  messages: ChatMessage[]
  interactions: InteractionData[]
  filter: FilterType
}

export function useFeedItems({
  messages,
  interactions,
  filter,
}: UseFeedItemsParams): FeedItem[] {
  return useMemo(() => {
    const feedItems: FeedItem[] = []

    // Add chat messages
    messages.forEach((msg) => {
      feedItems.push({ type: 'chat', data: msg })
    })

    // Add active interactions
    interactions.forEach((interaction) => {
      feedItems.push({ type: 'interaction', data: interaction })
    })

    // Sort by time (interactions use triggerTime, messages use createdAt)
    feedItems.sort((a, b) => {
      const aTime =
        a.type === 'chat'
          ? new Date(a.data.createdAt).getTime()
          : a.data.triggerTime * 1000
      const bTime =
        b.type === 'chat'
          ? new Date(b.data.createdAt).getTime()
          : b.data.triggerTime * 1000
      return aTime - bTime
    })

    // Filter feed items based on selected filter
    return feedItems.filter((item) => {
      if (filter === 'all') return true
      if (filter === 'chat') return item.type === 'chat'
      if (filter === 'widgets') return item.type === 'interaction'
      return true
    })
  }, [messages, interactions, filter])
}
