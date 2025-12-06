import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { getUBillClient, normalizePhoneNumber, isValidGeorgianPhone, UBILL_STATUS } from '@/lib/sms'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

/**
 * POST /api/admin/sms/send-test
 * Send a test SMS to verify API configuration
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { phone, message, brandId } = body

    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(phone)

    if (!normalizedPhone || !isValidGeorgianPhone(normalizedPhone)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number',
          message: 'Please enter a valid Georgian mobile number (e.g., 551234567)',
        },
        { status: 400 }
      )
    }

    // Get settings and client
    const settings = await prisma.smsSettings.findFirst()

    if (!settings?.apiKey) {
      return NextResponse.json(
        {
          error: 'SMS not configured',
          message: 'Please configure your UBill API key in SMS settings',
        },
        { status: 400 }
      )
    }

    // Determine brand ID to use
    const useBrandId = brandId ?? settings.defaultBrandId

    if (!useBrandId) {
      return NextResponse.json(
        {
          error: 'No brand ID specified',
          message: 'Please specify a brand ID or set a default brand in SMS settings',
        },
        { status: 400 }
      )
    }

    const client = await getUBillClient()

    if (!client) {
      return NextResponse.json(
        { error: 'Failed to initialize SMS client' },
        { status: 500 }
      )
    }

    // Send the test SMS
    const response = await client.send({
      brandId: useBrandId,
      numbers: normalizedPhone,
      text: message,
      stopList: false,
    })

    // Log the SMS
    await prisma.smsLog.create({
      data: {
        phone: normalizedPhone,
        message,
        brandId: useBrandId,
        type: 'TRANSACTIONAL',
        referenceType: 'manual',
        referenceId: 'test',
        ubillSmsId: response.smsID ? String(response.smsID) : null,
        status: response.statusID === UBILL_STATUS.SENT ? 'SENT' : 'ERROR',
        error: response.statusID !== UBILL_STATUS.SENT ? response.message : null,
      },
    })

    if (response.statusID !== UBILL_STATUS.SENT) {
      logger.error('Test SMS failed:', response)
      return NextResponse.json(
        {
          error: 'Failed to send SMS',
          statusID: response.statusID,
          message: response.message || 'Unknown error from UBill',
        },
        { status: 500 }
      )
    }

    logger.info('Test SMS sent successfully:', {
      phone: normalizedPhone,
      smsID: response.smsID,
    })

    return NextResponse.json({
      success: true,
      smsID: response.smsID,
      phone: normalizedPhone,
      message: 'Test SMS sent successfully',
    })
  } catch (error) {
    logger.error('Error sending test SMS:', error)
    return errorResponse('Failed to send test SMS')
  }
}
