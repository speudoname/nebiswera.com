import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

// Brand type for type safety
interface SmsBrand {
  id: number
  name: string
}

/**
 * GET /api/admin/sms/settings
 * Get SMS settings (API key masked)
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const settings = await prisma.smsSettings.findFirst()

    if (!settings) {
      // Return empty settings structure
      return NextResponse.json({
        settings: null,
        isConfigured: false,
      })
    }

    // Mask the API key for security
    const maskedApiKey = settings.apiKey
      ? `${settings.apiKey.substring(0, 4)}...${settings.apiKey.substring(settings.apiKey.length - 4)}`
      : null

    return NextResponse.json({
      settings: {
        id: settings.id,
        apiKey: maskedApiKey,
        hasApiKey: !!settings.apiKey,
        defaultBrandId: settings.defaultBrandId,
        brands: settings.brands as SmsBrand[] | null,
        unsubscribeFooterKa: settings.unsubscribeFooterKa,
        unsubscribeFooterEn: settings.unsubscribeFooterEn,
        dailySendLimit: settings.dailySendLimit,
        updatedAt: settings.updatedAt,
      },
      isConfigured: !!settings.apiKey,
    })
  } catch (error) {
    logger.error('Error fetching SMS settings:', error)
    return errorResponse('Failed to fetch SMS settings')
  }
}

/**
 * POST /api/admin/sms/settings
 * Create or update SMS settings
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const {
      apiKey,
      defaultBrandId,
      brands,
      unsubscribeFooterKa,
      unsubscribeFooterEn,
      dailySendLimit,
    } = body

    // Find existing settings
    const existing = await prisma.smsSettings.findFirst()

    // Build update data - only include API key if it's provided (not empty)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    // Only update API key if provided (not empty string)
    if (apiKey && apiKey.trim()) {
      updateData.apiKey = apiKey.trim()
    }

    if (defaultBrandId !== undefined) {
      updateData.defaultBrandId = defaultBrandId ? parseInt(defaultBrandId, 10) : null
    }

    if (brands !== undefined) {
      // Validate brands array
      if (Array.isArray(brands)) {
        updateData.brands = brands.map((b: { id: string | number; name: string }) => ({
          id: typeof b.id === 'string' ? parseInt(b.id, 10) : b.id,
          name: String(b.name),
        }))
      }
    }

    if (unsubscribeFooterKa !== undefined) {
      updateData.unsubscribeFooterKa = unsubscribeFooterKa
    }

    if (unsubscribeFooterEn !== undefined) {
      updateData.unsubscribeFooterEn = unsubscribeFooterEn
    }

    if (dailySendLimit !== undefined) {
      updateData.dailySendLimit = dailySendLimit ? parseInt(dailySendLimit, 10) : null
    }

    let settings

    if (existing) {
      // Update existing
      settings = await prisma.smsSettings.update({
        where: { id: existing.id },
        data: updateData,
      })
    } else {
      // Create new - API key is required for new settings
      if (!updateData.apiKey) {
        return NextResponse.json(
          { error: 'API key is required' },
          { status: 400 }
        )
      }

      settings = await prisma.smsSettings.create({
        data: {
          apiKey: updateData.apiKey,
          defaultBrandId: updateData.defaultBrandId,
          brands: updateData.brands,
          unsubscribeFooterKa: updateData.unsubscribeFooterKa || 'გააუქმე: nebiswera.com/nosms',
          unsubscribeFooterEn: updateData.unsubscribeFooterEn || 'Unsubscribe: nebiswera.com/nosms',
          dailySendLimit: updateData.dailySendLimit,
        },
      })
    }

    logger.info('SMS settings updated')

    // Return masked settings
    const maskedApiKey = settings.apiKey
      ? `${settings.apiKey.substring(0, 4)}...${settings.apiKey.substring(settings.apiKey.length - 4)}`
      : null

    return NextResponse.json({
      settings: {
        id: settings.id,
        apiKey: maskedApiKey,
        hasApiKey: !!settings.apiKey,
        defaultBrandId: settings.defaultBrandId,
        brands: settings.brands as SmsBrand[] | null,
        unsubscribeFooterKa: settings.unsubscribeFooterKa,
        unsubscribeFooterEn: settings.unsubscribeFooterEn,
        dailySendLimit: settings.dailySendLimit,
        updatedAt: settings.updatedAt,
      },
      isConfigured: !!settings.apiKey,
    })
  } catch (error) {
    logger.error('Error updating SMS settings:', error)
    return errorResponse('Failed to update SMS settings')
  }
}
