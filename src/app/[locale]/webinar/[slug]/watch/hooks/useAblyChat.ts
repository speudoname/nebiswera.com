/**
 * useAblyChat Hook
 *
 * Manages Ably real-time chat connection, message history, and subscriptions
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import Ably from 'ably'
import type * as AblyTypes from 'ably'

export interface ChatMessage {
  id: string
  senderName: string
  message: string
  isFromModerator: boolean
  isSimulated: boolean
  createdAt: string
}

interface UseAblyChatParams {
  webinarId: string
  slug: string
  accessToken: string
  enabled?: boolean
}

interface UseAblyChatResult {
  messages: ChatMessage[]
  isConnected: boolean
  addMessage: (message: ChatMessage) => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}

export function useAblyChat({
  webinarId,
  slug,
  accessToken,
  enabled = true,
}: UseAblyChatParams): UseAblyChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const ablyClientRef = useRef<AblyTypes.Realtime | null>(null)
  const channelRef = useRef<AblyTypes.RealtimeChannel | null>(null)

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === message.id)) {
        return prev
      }
      return [...prev, message]
    })
  }

  useEffect(() => {
    if (!enabled) return

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
          setIsConnected(true)
        })

        ably.connection.on('disconnected', () => {
          setIsConnected(false)
        })

        ably.connection.on('failed', () => {
          setIsConnected(false)
        })

        // Get the channel for this webinar
        const channel = ably.channels.get(`webinar:${webinarId}:chat`)
        channelRef.current = channel

        // Subscribe to new messages
        channel.subscribe('new-message', (message) => {
          const chatMessage = message.data as ChatMessage
          addMessage(chatMessage)
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
  }, [slug, accessToken, webinarId, enabled])

  return {
    messages,
    isConnected,
    addMessage,
    setMessages,
  }
}
