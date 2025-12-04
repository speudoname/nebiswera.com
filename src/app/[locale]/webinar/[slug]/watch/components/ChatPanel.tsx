'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, User, MessageCircle, Zap } from 'lucide-react'
import Ably from 'ably'
import type * as AblyTypes from 'ably'
import { InteractiveWidget } from './InteractiveWidgets'

interface ChatMessage {
  id: string
  senderName: string
  message: string
  isFromModerator: boolean
  isSimulated: boolean
  createdAt: string
}

interface InteractionData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: Record<string, unknown>
}

type FeedItem =
  | { type: 'chat'; data: ChatMessage }
  | { type: 'interaction'; data: InteractionData }

type FilterType = 'all' | 'chat' | 'widgets'

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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ablyClientRef = useRef<AblyTypes.Realtime | null>(null)
  const channelRef = useRef<AblyTypes.RealtimeChannel | null>(null)
  const lastSimulatedTime = useRef(0)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, interactions, scrollToBottom])

  // Connect to Ably for real-time chat
  useEffect(() => {
    const connectAbly = async () => {
      try {
        // Create Ably client with token auth
        const ably = new Ably.Realtime({
          authUrl: `/api/webinars/${slug}/chat/auth?token=${accessToken}`,
          authMethod: 'GET',
        })

        ablyClientRef.current = ably

        // Handle connection state changes
        ably.connection.on('connected', () => {
          console.log('Connected to Ably')
          setIsConnected(true)
        })

        ably.connection.on('disconnected', () => {
          console.log('Disconnected from Ably')
          setIsConnected(false)
        })

        ably.connection.on('failed', (error) => {
          console.error('Ably connection failed:', error)
          setIsConnected(false)
        })

        // Get the channel for this webinar
        const channel = ably.channels.get(`webinar:${webinarId}:chat`)
        channelRef.current = channel

        // Subscribe to new messages
        channel.subscribe('new-message', (message) => {
          const chatMessage = message.data as ChatMessage
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === chatMessage.id)) {
              return prev
            }
            return [...prev, chatMessage]
          })
        })

        // Load recent message history from Ably (last 50 messages)
        const history = await channel.history({ limit: 50 })
        if (history.items.length > 0) {
          const historicalMessages = history.items
            .map((msg) => msg.data as ChatMessage)
            .reverse() // Ably returns newest first, we want oldest first
          setMessages(historicalMessages)
        }
      } catch (error) {
        console.error('Failed to connect to Ably:', error)
        setIsConnected(false)
      }
    }

    connectAbly()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      if (ablyClientRef.current) {
        ablyClientRef.current.close()
      }
    }
  }, [slug, accessToken, webinarId])

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
  }, [currentVideoTime, playbackMode, slug, accessToken])

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/webinars/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          message: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Combine chat messages and interactions into a unified feed
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
    const aTime = a.type === 'chat'
      ? new Date(a.data.createdAt).getTime()
      : a.data.triggerTime * 1000
    const bTime = b.type === 'chat'
      ? new Date(b.data.createdAt).getTime()
      : b.data.triggerTime * 1000
    return aTime - bTime
  })

  // Filter feed items based on selected filter
  const filteredFeed = feedItems.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'chat') return item.type === 'chat'
    if (filter === 'widgets') return item.type === 'interaction'
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('chat')}
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
          onClick={() => setFilter('widgets')}
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
          filteredFeed.map((item, index) => {
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
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatMessageBubble({
  message,
  isOwnMessage,
}: {
  message: ChatMessage
  isOwnMessage: boolean
}) {
  return (
    <div className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.isFromModerator
            ? 'bg-primary-500 text-white'
            : message.isSimulated
            ? 'bg-gray-400 text-white'
            : 'bg-gray-300 text-gray-700'
        }`}
      >
        <User className="w-4 h-4" />
      </div>

      {/* Message */}
      <div
        className={`max-w-[80%] ${
          isOwnMessage ? 'items-end' : 'items-start'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-900">
            {message.senderName}
          </span>
          {message.isFromModerator && (
            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
              Host
            </span>
          )}
          {message.isSimulated && (
            <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">
              🤖 Bot
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div
          className={`px-3 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-primary-500 text-white'
              : 'bg-white shadow-sm border border-gray-200'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  )
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
