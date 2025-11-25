import { NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/settings'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    console.error('Failed to get settings:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    } = body

    const updateData: Record<string, string> = {}

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

    const settings = await updateSettings(updateData)

    // Return full settings (admin only endpoint)
    return NextResponse.json({
      ...settings,
      hasPostmarkToken: !!settings.postmarkServerToken,
      hasMarketingToken: !!settings.marketingServerToken,
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
