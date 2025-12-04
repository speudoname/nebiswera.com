'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { InteractiveWidget } from './InteractiveWidgets'
import { useAblyChat } from '../hooks/useAblyChat'
import { useFeedItems } from '../hooks/useFeedItems'
import type { InteractionData, FilterType } from '../hooks/useFeedItems'
import type { ChatMessage } from '../hooks/useAblyChat'
import { FilterTabs, ChatMessageBubble, MessageInput } from './chat'

interface ChatPanelProps {
  webinarId: string
  registrationId: string
  userName: string
  accessToken: string
  slug: string
  currentVideoTime: number
  playbackMode: 'simulated_live' | 'on_demand' | 'replay'
  interactions: InteractionData[]
  onInteractionDismiss: (id: string) => void
  onInteractionRespond: (id: string, response: unknown) => void
}

export function ChatPanel({
  webinarId,
  registrationId,
  userName,
  accessToken,
  slug,
  currentVideoTime,
  playbackMode,
  interactions,
  onInteractionDismiss,
  onInteractionRespond,
}: ChatPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSimulatedTime = useRef(0)

  // Ably real-time chat
  const { messages, isConnected, setMessages } = useAblyChat({
    webinarId,
    slug,
    accessToken,
  })

  // Unified feed with filtering
  const filteredFeed = useFeedItems({ messages, interactions, filter })

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, interactions, scrollToBottom])

  // Load simulated messages based on video time
  useEffect(() => {
    if (playbackMode !== 'simulated_live') return

    const loadSimulatedMessages = async () => {
      const currentSecond = Math.floor(currentVideoTime)
      if (currentSecond <= lastSimulatedTime.current) return

      try {
        const response = await fetch(
          `/api/webinars/${slug}/chat/simulated?from=${lastSimulatedTime.current}&to=${currentSecond}&token=${accessToken}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.messages?.length > 0) {
            setMessages((prev) => {
              const newMessages = data.messages.filter(
                (m: ChatMessage) => !prev.some((p) => p.id === m.id)
              )
              return [...prev, ...newMessages]
            })
          }
        }
      } catch (error) {
        console.error('Failed to load simulated messages:', error)
      }

      lastSimulatedTime.current = currentSecond
    }

    loadSimulatedMessages()
  }, [currentVideoTime, playbackMode, slug, accessToken, setMessages])

  // Send message
  const handleSend = async (message: string) => {
    const response = await fetch(`/api/webinars/${slug}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: accessToken,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <FilterTabs filter={filter} onFilterChange={setFilter} />

      {/* Connection status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 text-xs text-center">
          Connecting to chat...
        </div>
      )}

      {/* Unified feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {filteredFeed.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No {filter === 'all' ? 'activity' : filter} yet</p>
          </div>
        ) : (
          filteredFeed.map((item) => {
            if (item.type === 'chat') {
              return (
                <ChatMessageBubble
                  key={item.data.id}
                  message={item.data}
                  isOwnMessage={item.data.senderName === userName}
                />
              )
            } else {
              return (
                <InteractiveWidget
                  key={item.data.id}
                  interaction={item.data}
                  accessToken={accessToken}
                  slug={slug}
                  registrationId={registrationId}
                  onDismiss={onInteractionDismiss}
                  onRespond={onInteractionRespond}
                />
              )
            }
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  )
}
