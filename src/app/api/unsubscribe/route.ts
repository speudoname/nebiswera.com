import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { verifyUnsubscribeToken } from '@/app/api/lib/unsubscribe-token'
import { logger } from '@/lib'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/unsubscribe - Process unsubscribe request
 */
export async function POST(request: Request) {
  // Rate limit to prevent abuse (uses 'auth' limiter: 5 requests per minute)
  const rateLimitResponse = await checkRateLimit(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { token, reason } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify the token
    const email = verifyUnsubscribeToken(token)

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired unsubscribe link' },
        { status: 400 }
      )
    }

    // Find the contact
    const contact = await prisma.contact.findFirst({
      where: { email },
    })

    if (!contact) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'Unsubscribe request processed',
      })
    }

    // Check if already unsubscribed
    if (contact.marketingStatus === 'UNSUBSCRIBED') {
      return NextResponse.json({
        success: true,
        alreadyUnsubscribed: true,
        message: 'You are already unsubscribed',
      })
    }

    // Update contact
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        marketingStatus: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
        unsubscribeReason: reason || 'User requested via unsubscribe link',
      },
    })

    // Sync with Postmark suppression list
    await addToPostmarkSuppressionList(email)

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    })
  } catch (error) {
    logger.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/unsubscribe - Check unsubscribe status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const email = verifyUnsubscribeToken(token)

  if (!email) {
    return NextResponse.json(
      { error: 'Invalid or expired unsubscribe link' },
      { status: 400 }
    )
  }

  // Mask the email for display
  const [localPart, domain] = email.split('@')
  const maskedLocal = localPart.length > 2
    ? `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`
    : localPart
  const maskedEmail = `${maskedLocal}@${domain}`

  return NextResponse.json({
    valid: true,
    maskedEmail,
  })
}

/**
 * Add email to Postmark suppression list
 */
async function addToPostmarkSuppressionList(email: string) {
  try {
    const settings = await getSettings()

    if (!settings.marketingServerToken) {
      return
    }

    await fetch('https://api.postmarkapp.com/message-streams/broadcast/suppressions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': settings.marketingServerToken,
      },
      body: JSON.stringify({
        Suppressions: [{ EmailAddress: email }],
      }),
    })
  } catch (error) {
    logger.error('Failed to add to Postmark suppression list:', error)
    // Don't fail the unsubscribe - we'll sync later
  }
}
