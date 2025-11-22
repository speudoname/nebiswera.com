import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getSettings, updateSettings } from '@/lib/settings'
import type { NextRequest } from 'next/server'

async function isAdmin(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  return token?.role === 'ADMIN'
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await getSettings()

    // Mask the token for security (show only last 4 chars)
    const maskedSettings = {
      ...settings,
      postmarkServerToken: settings.postmarkServerToken
        ? `****${settings.postmarkServerToken.slice(-4)}`
        : null,
      hasPostmarkToken: !!settings.postmarkServerToken,
    }

    return NextResponse.json(maskedSettings)
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
    const { postmarkServerToken, postmarkStreamName, emailFromAddress, emailFromName } = body

    const updateData: Record<string, string> = {}

    // Only update token if provided and not the masked version
    if (postmarkServerToken && !postmarkServerToken.startsWith('****')) {
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

    const settings = await updateSettings(updateData)

    // Mask the token for response
    const maskedSettings = {
      ...settings,
      postmarkServerToken: settings.postmarkServerToken
        ? `****${settings.postmarkServerToken.slice(-4)}`
        : null,
      hasPostmarkToken: !!settings.postmarkServerToken,
    }

    return NextResponse.json(maskedSettings)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
