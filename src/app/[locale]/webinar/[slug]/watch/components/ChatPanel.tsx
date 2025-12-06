'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { InteractiveWidget } from './InteractiveWidgets'
import { useAblyChat } from '../hooks/useAblyChat'
import type { ChatMessage } from '../hooks/useAblyChat'
import type { InteractionData } from '@/types'
import type { AnsweredInteraction } from '../hooks/useInteractionTiming'
import { MessageCircle, Zap } from 'lucide-react'

type FilterType = 'all' | 'widgets'

interface ChatPanelProps {
  webinarId: string
  registrationId: string
  userName: string
  accessToken: string
  slug: string
  currentVideoTime: number
  playbackMode: 'simulated_live' | 'replay'
  /** All triggered interactions (active + answered) */
  interactions: (InteractionData | AnsweredInteraction)[]
  onInteractionDismiss: (id: string) => void
  onInteractionRespond: (id: string, response: unknown, interactionType?: string, interactionTitle?: string) => void
  /** Callback when user answers an interaction - to mark it as answered */
  onInteractionAnswered?: (id: string, response: unknown) => void
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
  onInteractionAnswered,
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
  const handleSend = useCallback(async (message: string) => {
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
  }, [slug, accessToken])

  // Handle interaction response - call both callbacks
  const handleInteractionRespond = useCallback((id: string, response: unknown) => {
    // Mark as answered (keeps it in the feed with results)
    onInteractionAnswered?.(id, response)
    // Original callback for tracking
    const interaction = interactions.find(i => i.id === id)
    if (interaction) {
      onInteractionRespond(id, response, interaction.type, interaction.title)
    }
  }, [interactions, onInteractionRespond, onInteractionAnswered])

  // Build unified feed
  type FeedItem =
    | { type: 'chat'; data: ChatMessage; sortTime: number }
    | { type: 'interaction'; data: InteractionData | AnsweredInteraction; sortTime: number }

  const feedItems: FeedItem[] = []

  // Add chat messages
  messages.forEach((msg) => {
    feedItems.push({
      type: 'chat',
      data: msg,
      sortTime: new Date(msg.createdAt).getTime(),
    })
  })

  // Add interactions
  interactions.forEach((interaction) => {
    feedItems.push({
      type: 'interaction',
      data: interaction,
      sortTime: interaction.triggerTime * 1000,
    })
  })

  // Sort by time
  feedItems.sort((a, b) => a.sortTime - b.sortTime)

  // Filter
  const filteredFeed = feedItems.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'widgets') return item.type === 'interaction'
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          All
        </button>
        <button
          onClick={() => setFilter('widgets')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
            filter === 'widgets'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          Widgets
          {interactions.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
              {interactions.length}
            </span>
          )}
        </button>
      </div>

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
            <p className="text-sm">
              {filter === 'all' ? 'No activity yet' : 'No widgets yet'}
            </p>
            {filter === 'widgets' && (
              <p className="text-xs text-gray-400 mt-1">
                Polls and interactions will appear here as the video plays
              </p>
            )}
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
                  onRespond={handleInteractionRespond}
                />
              )
            }
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - only show when viewing all */}
      {filter === 'all' && (
        <MessageInput onSend={handleSend} />
      )}
    </div>
  )
}

// ==================================================
// Chat Message Bubble
// ==================================================
interface ChatMessageBubbleProps {
  message: ChatMessage
  isOwnMessage: boolean
}

function ChatMessageBubble({ message, isOwnMessage }: ChatMessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isOwnMessage
            ? 'bg-primary-500 text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-medium text-primary-600 mb-0.5">
            {message.senderName}
          </p>
        )}
        <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
          {message.message}
        </p>
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-primary-200' : 'text-gray-400'
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  )
}

// ==================================================
// Message Input
// ==================================================
interface MessageInputProps {
  onSend: (message: string) => Promise<void>
}

function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await onSend(message.trim())
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  )
}
