import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { getUBillClient } from '@/lib/sms'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

/**
 * GET /api/admin/sms/balance
 * Get UBill SMS balance
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const client = await getUBillClient()

    if (!client) {
      return NextResponse.json(
        {
          error: 'SMS not configured',
          message: 'Please configure your UBill API key in SMS settings',
        },
        { status: 400 }
      )
    }

    const response = await client.getBalance()

    if (response.statusID !== 0) {
      return NextResponse.json(
        {
          error: 'Failed to fetch balance',
          statusID: response.statusID,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      balance: response.sms ?? 0,
      statusID: response.statusID,
    })
  } catch (error) {
    logger.error('Error fetching SMS balance:', error)
    return errorResponse('Failed to fetch SMS balance')
  }
}
