'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, User } from 'lucide-react'

interface ChatMessage {
  id: string
  senderName: string
  message: string
  isFromModerator: boolean
  isSimulated: boolean
  createdAt: string
}

interface ChatPanelProps {
  webinarId: string
  registrationId: string
  userName: string
  accessToken: string
  slug: string
  currentVideoTime: number
  playbackMode: 'simulated_live' | 'on_demand' | 'replay'
}

export function ChatPanel({
  webinarId,
  registrationId,
  userName,
  accessToken,
  slug,
  currentVideoTime,
  playbackMode,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const lastSimulatedTime = useRef(0)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Connect to SSE stream
  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource(
        `/api/webinars/${slug}/chat/stream?token=${accessToken}`
      )

      eventSource.onopen = () => {
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'message') {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === data.message.id)) {
                return prev
              }
              return [...prev, data.message]
            })
          } else if (data.type === 'history') {
            setMessages(data.messages)
          }
        } catch (error) {
          console.error('Failed to parse chat message:', error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000)
      }

      eventSourceRef.current = eventSource
    }

    connectSSE()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [slug, accessToken])

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

  return (
    <div className="flex flex-col h-[calc(100%-60px)]">
      {/* Connection status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 text-xs text-center">
          Connecting to chat...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hi!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderName === userName}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neu-dark">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-neu-base border border-neu-dark rounded-lg shadow-neu-inset-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-neu-sm"
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
            : 'bg-neu-dark text-text-secondary'
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
          <span className="text-xs font-medium text-text-primary">
            {message.senderName}
          </span>
          {message.isFromModerator && (
            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
              Host
            </span>
          )}
          <span className="text-xs text-text-muted">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div
          className={`px-3 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-primary-500 text-white'
              : 'bg-neu-light shadow-neu-sm'
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
