import { NextResponse } from 'next/server'
import { getSettings, updateSettings, type SocialLinks } from '@/lib/settings'
import { clearEmailSettingsCache } from '@/lib/email'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const settings = await getSettings()

    // Return full settings (admin only endpoint)
    return NextResponse.json({
      ...settings,
      hasPostmarkToken: !!settings.postmarkServerToken,
      hasMarketingToken: !!settings.marketingServerToken,
    })
  } catch (error) {
    logger.error('Failed to get settings:', error)
    return errorResponse('Failed to get settings')
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const {
      // Transactional settings
      postmarkServerToken,
      postmarkStreamName,
      emailFromAddress,
      emailFromName,
      // Marketing settings
      marketingServerToken,
      marketingStreamName,
      marketingFromAddress,
      marketingFromName,
      // Footer settings (CAN-SPAM)
      companyName,
      companyNameKa,
      companyAddress,
      companyAddressKa,
      companyPhone,
      socialLinks,
    } = body

    const updateData: Record<string, string | SocialLinks | null> = {}

    // Transactional settings - only update token if provided
    if (postmarkServerToken) {
      updateData.postmarkServerToken = postmarkServerToken
    }

    if (postmarkStreamName !== undefined) {
      updateData.postmarkStreamName = postmarkStreamName
    }

    if (emailFromAddress !== undefined) {
      updateData.emailFromAddress = emailFromAddress
    }

    if (emailFromName !== undefined) {
      updateData.emailFromName = emailFromName
    }

    // Marketing settings - only update token if provided
    if (marketingServerToken) {
      updateData.marketingServerToken = marketingServerToken
    }

    if (marketingStreamName !== undefined) {
      updateData.marketingStreamName = marketingStreamName
    }

    if (marketingFromAddress !== undefined) {
      updateData.marketingFromAddress = marketingFromAddress
    }

    if (marketingFromName !== undefined) {
      updateData.marketingFromName = marketingFromName
    }

    // Footer settings (CAN-SPAM compliance)
    if (companyName !== undefined) {
      updateData.companyName = companyName
    }

    if (companyNameKa !== undefined) {
      updateData.companyNameKa = companyNameKa
    }

    if (companyAddress !== undefined) {
      updateData.companyAddress = companyAddress
    }

    if (companyAddressKa !== undefined) {
      updateData.companyAddressKa = companyAddressKa
    }

    if (companyPhone !== undefined) {
      updateData.companyPhone = companyPhone || null
    }

    if (socialLinks !== undefined) {
      updateData.socialLinks = socialLinks
    }

    const settings = await updateSettings(updateData)

    // Clear email settings cache so changes take effect immediately
    clearEmailSettingsCache()

    // Return full settings (admin only endpoint)
    return NextResponse.json({
      ...settings,
      hasPostmarkToken: !!settings.postmarkServerToken,
      hasMarketingToken: !!settings.marketingServerToken,
    })
  } catch (error) {
    logger.error('Failed to update settings:', error)
    return errorResponse('Failed to update settings')
  }
}
