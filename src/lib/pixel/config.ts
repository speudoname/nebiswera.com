/**
 * Facebook Pixel Configuration
 * Fetches and caches pixel settings from database
 */

import { prisma } from '@/lib/db'
import type { PixelConfig } from './types'

// Cache configuration for 5 minutes
let cachedConfig: PixelConfig | null = null
let cacheTimestamp: number = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch pixel configuration from database with caching
 */
export async function getPixelConfig(): Promise<PixelConfig> {
  const now = Date.now()

  // Return cached config if still valid
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig
  }

  try {
    const settings = await prisma.settings.findFirst({
      select: {
        fbPixelId: true,
        fbAccessToken: true,
        fbTestEventCode: true,
        fbPixelEnabled: true,
        fbTestMode: true,
      },
    })

    cachedConfig = {
      fbPixelId: settings?.fbPixelId || null,
      fbAccessToken: settings?.fbAccessToken || null,
      fbTestEventCode: settings?.fbTestEventCode || null,
      fbPixelEnabled: settings?.fbPixelEnabled || false,
      fbTestMode: settings?.fbTestMode || false,
    }
    cacheTimestamp = now

    return cachedConfig
  } catch (error) {
    console.error('[Pixel Config] Failed to fetch config:', error)
    // Return default disabled config on error
    return {
      fbPixelId: null,
      fbAccessToken: null,
      fbTestEventCode: null,
      fbPixelEnabled: false,
      fbTestMode: false,
    }
  }
}

/**
 * Check if pixel is enabled and properly configured
 */
export async function isPixelEnabled(): Promise<boolean> {
  const config = await getPixelConfig()
  return config.fbPixelEnabled && !!config.fbPixelId
}

/**
 * Check if pixel is in test mode
 */
export async function isTestMode(): Promise<boolean> {
  const config = await getPixelConfig()
  return config.fbTestMode
}

/**
 * Check if server-side tracking (Conversions API) is configured
 */
export async function isServerSideEnabled(): Promise<boolean> {
  const config = await getPixelConfig()
  return config.fbPixelEnabled && !!config.fbPixelId && !!config.fbAccessToken
}

/**
 * Invalidate the config cache (call after config update)
 */
export function invalidateConfigCache(): void {
  cachedConfig = null
  cacheTimestamp = 0
}

/**
 * Get pixel ID for client-side script (returns null if disabled)
 */
export async function getClientPixelId(): Promise<string | null> {
  const config = await getPixelConfig()
  if (!config.fbPixelEnabled || !config.fbPixelId) {
    return null
  }
  return config.fbPixelId
}

/**
 * Update pixel configuration in database
 */
export async function updatePixelConfig(updates: Partial<PixelConfig>): Promise<PixelConfig> {
  const settings = await prisma.settings.upsert({
    where: { id: 'app_settings' },
    create: {
      id: 'app_settings',
      fbPixelId: updates.fbPixelId,
      fbAccessToken: updates.fbAccessToken,
      fbTestEventCode: updates.fbTestEventCode,
      fbPixelEnabled: updates.fbPixelEnabled ?? false,
      fbTestMode: updates.fbTestMode ?? false,
    },
    update: {
      ...(updates.fbPixelId !== undefined && { fbPixelId: updates.fbPixelId }),
      ...(updates.fbAccessToken !== undefined && { fbAccessToken: updates.fbAccessToken }),
      ...(updates.fbTestEventCode !== undefined && { fbTestEventCode: updates.fbTestEventCode }),
      ...(updates.fbPixelEnabled !== undefined && { fbPixelEnabled: updates.fbPixelEnabled }),
      ...(updates.fbTestMode !== undefined && { fbTestMode: updates.fbTestMode }),
    },
    select: {
      fbPixelId: true,
      fbAccessToken: true,
      fbTestEventCode: true,
      fbPixelEnabled: true,
      fbTestMode: true,
    },
  })

  // Invalidate cache after update
  invalidateConfigCache()

  return {
    fbPixelId: settings.fbPixelId,
    fbAccessToken: settings.fbAccessToken,
    fbTestEventCode: settings.fbTestEventCode,
    fbPixelEnabled: settings.fbPixelEnabled,
    fbTestMode: settings.fbTestMode,
  }
}
