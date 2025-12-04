// Simulated chat bot for webinars
// Publishes pre-scripted messages to Ably at specified times

import { publishChatMessage } from '@/lib/ably'
import { logger } from '@/lib'

export interface ChatBotMessage {
  time: number // Seconds from session start
  sender: string // Bot name (e.g., "John Doe")
  message: string
  avatar?: string // Optional avatar URL
}

export interface ChatBotScript {
  enabled: boolean
  messages: ChatBotMessage[]
}

interface ActiveBot {
  webinarId: string
  sessionStartTime: Date
  script: ChatBotScript
  timeouts: NodeJS.Timeout[]
  isRunning: boolean
}

// Store active bots (in-memory for now, can be moved to Redis for multi-instance)
const activeBots = new Map<string, ActiveBot>()

/**
 * Start a chat bot for a webinar session
 * Publishes messages at specified times relative to session start
 */
export function startChatBot(
  webinarId: string,
  script: ChatBotScript,
  sessionStartTime: Date = new Date()
): { success: boolean; error?: string } {
  // Validate script
  if (!script || !script.enabled || !script.messages || script.messages.length === 0) {
    return { success: false, error: 'Invalid or empty chat script' }
  }

  // Stop existing bot if running
  if (activeBots.has(webinarId)) {
    stopChatBot(webinarId)
  }

  const bot: ActiveBot = {
    webinarId,
    sessionStartTime,
    script,
    timeouts: [],
    isRunning: true,
  }

  // Schedule all messages
  const now = new Date()
  const timeSinceStart = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)

  for (const msg of script.messages) {
    const delay = (msg.time - timeSinceStart) * 1000

    // Only schedule future messages
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        if (!bot.isRunning) return

        try {
          await publishChatMessage(webinarId, {
            id: `bot-${webinarId}-${msg.time}`, // Deterministic ID
            senderName: msg.sender,
            message: msg.message,
            isFromModerator: false,
            isSimulated: true, // Mark as bot message
            createdAt: new Date().toISOString(),
          })

          logger.info(
            `[ChatBot] Published message from "${msg.sender}" at ${msg.time}s for webinar ${webinarId}`
          )
        } catch (error) {
          logger.error(
            `[ChatBot] Failed to publish message for webinar ${webinarId}:`,
            error
          )
        }
      }, delay)

      bot.timeouts.push(timeout)
    }
  }

  activeBots.set(webinarId, bot)

  logger.info(
    `[ChatBot] Started for webinar ${webinarId} with ${bot.timeouts.length} scheduled messages`
  )

  return { success: true }
}

/**
 * Stop a running chat bot
 * Clears all scheduled timeouts
 */
export function stopChatBot(webinarId: string): { success: boolean } {
  const bot = activeBots.get(webinarId)

  if (!bot) {
    return { success: false }
  }

  // Clear all timeouts
  bot.isRunning = false
  bot.timeouts.forEach((timeout) => clearTimeout(timeout))
  bot.timeouts = []

  activeBots.delete(webinarId)

  logger.info(`[ChatBot] Stopped for webinar ${webinarId}`)

  return { success: true }
}

/**
 * Check if a chat bot is currently running for a webinar
 */
export function isChatBotRunning(webinarId: string): boolean {
  const bot = activeBots.get(webinarId)
  return bot !== undefined && bot.isRunning
}

/**
 * Get bot status for a webinar
 */
export function getChatBotStatus(webinarId: string): {
  isRunning: boolean
  scheduledMessages?: number
  sessionStartTime?: Date
} {
  const bot = activeBots.get(webinarId)

  if (!bot) {
    return { isRunning: false }
  }

  return {
    isRunning: bot.isRunning,
    scheduledMessages: bot.timeouts.length,
    sessionStartTime: bot.sessionStartTime,
  }
}

/**
 * Stop all running chat bots
 * Useful for graceful shutdown
 */
export function stopAllChatBots(): number {
  const webinarIds = Array.from(activeBots.keys())

  for (const webinarId of webinarIds) {
    stopChatBot(webinarId)
  }

  logger.info(`[ChatBot] Stopped ${webinarIds.length} bots`)

  return webinarIds.length
}

/**
 * Preview when messages will be sent
 * Useful for testing and admin UI
 */
export function previewChatBotSchedule(
  script: ChatBotScript,
  sessionStartTime: Date = new Date()
): Array<{
  time: number
  sender: string
  message: string
  sendAt: Date
  delay: string
}> {
  if (!script || !script.enabled || !script.messages) {
    return []
  }

  const now = new Date()

  return script.messages.map((msg) => {
    const sendAt = new Date(sessionStartTime.getTime() + msg.time * 1000)
    const delayMs = sendAt.getTime() - now.getTime()
    const delayMinutes = Math.floor(delayMs / 60000)
    const delaySeconds = Math.floor((delayMs % 60000) / 1000)

    return {
      time: msg.time,
      sender: msg.sender,
      message: msg.message,
      sendAt,
      delay:
        delayMs > 0
          ? `in ${delayMinutes}m ${delaySeconds}s`
          : `${Math.abs(delayMinutes)}m ${Math.abs(delaySeconds)}s ago`,
    }
  })
}
