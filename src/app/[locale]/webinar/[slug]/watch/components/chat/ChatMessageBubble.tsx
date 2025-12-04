/**
 * ChatMessageBubble Component
 *
 * Displays a single chat message with avatar, sender name, badges, and timestamp
 */

'use client'

import { User } from 'lucide-react'
import type { ChatMessage } from '../../hooks/useAblyChat'

interface ChatMessageBubbleProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export function ChatMessageBubble({
  message,
  isOwnMessage,
}: ChatMessageBubbleProps) {
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
