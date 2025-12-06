import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { normalizePhoneNumber, isValidGeorgianPhone } from '@/lib/sms'

/**
 * POST /api/sms/unsubscribe
 * Unsubscribe a phone number from SMS marketing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone || !isValidGeorgianPhone(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Find contact by phone
    const contact = await prisma.contact.findFirst({
      where: { phone: normalizedPhone },
    })

    if (!contact) {
      // Even if contact not found, return success to prevent enumeration
      logger.info('Unsubscribe attempt for non-existent phone:', { phone: normalizedPhone })
      return NextResponse.json({
        success: true,
        message: 'If this number exists in our system, it has been unsubscribed',
      })
    }

    // Check if already unsubscribed
    if (contact.smsMarketingStatus === 'UNSUBSCRIBED') {
      return NextResponse.json({
        success: true,
        message: 'This number is already unsubscribed',
      })
    }

    // Update contact status
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        smsMarketingStatus: 'UNSUBSCRIBED',
        smsUnsubscribedAt: new Date(),
      },
    })

    logger.info('SMS unsubscribe successful:', {
      contactId: contact.id,
      phone: normalizedPhone,
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from SMS marketing',
    })
  } catch (error) {
    logger.error('SMS unsubscribe error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process unsubscribe request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sms/unsubscribe?phone=XXX
 * Check subscription status (for prefilling the form)
 */
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ subscribed: null })
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone || !isValidGeorgianPhone(normalizedPhone)) {
      return NextResponse.json({ subscribed: null })
    }

    const contact = await prisma.contact.findFirst({
      where: { phone: normalizedPhone },
      select: { smsMarketingStatus: true },
    })

    if (!contact) {
      return NextResponse.json({ subscribed: null })
    }

    return NextResponse.json({
      subscribed: contact.smsMarketingStatus === 'SUBSCRIBED',
    })
  } catch (error) {
    logger.error('SMS subscription check error:', error)
    return NextResponse.json({ subscribed: null })
  }
}
