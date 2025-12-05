/**
 * Ably Real-time Messaging Configuration
 *
 * Ably is used for real-time chat delivery in webinars.
 * Messages are still stored in the database for history/moderation.
 * Ably only handles real-time distribution to connected users.
 */

import Ably from 'ably'
import { logger } from '@/lib'

/**
 * Server-side Ably client (uses API key)
 * Used in API routes to publish messages
 */
export function getAblyServerClient() {
  const apiKey = process.env.ABLY_API_KEY

  if (!apiKey) {
    throw new Error('ABLY_API_KEY environment variable is not set')
  }

  return new Ably.Rest(apiKey)
}

/**
 * Get channel name for a webinar
 * Format: webinar:{webinarId}:chat
 */
export function getWebinarChatChannel(webinarId: string) {
  return `webinar:${webinarId}:chat`
}

/**
 * Publish a chat message to Ably
 * This broadcasts the message to all connected users in real-time
 */
export async function publishChatMessage(
  webinarId: string,
  message: {
    id: string
    senderName: string
    message: string
    isFromModerator: boolean
    isSimulated: boolean
    createdAt: string
  }
) {
  try {
    const ably = getAblyServerClient()
    const channelName = getWebinarChatChannel(webinarId)
    const channel = ably.channels.get(channelName)

    await channel.publish('new-message', message)

    return { success: true }
  } catch (error) {
    logger.error('Failed to publish message to Ably:', error)
    throw error
  }
}
