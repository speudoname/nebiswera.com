import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { getUBillClient, UBILL_STATUS, mapUBillStatusToSmsStatus } from '@/lib/sms'

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/process-sms-queue
 * Process pending SMS messages in the queue
 *
 * This cron job:
 * 1. Fetches all PENDING SMS logs
 * 2. Groups them by brandId + message (for batch sending)
 * 3. Sends each batch to UBill (multiple numbers in one API call)
 * 4. Updates log statuses
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings
    const settings = await prisma.smsSettings.findFirst()
    if (!settings?.apiKey) {
      return NextResponse.json({
        success: false,
        message: 'SMS not configured',
        processed: 0,
      })
    }

    // Check daily limit
    let remainingToday: number | null = null
    if (settings.dailySendLimit) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const sentToday = await prisma.smsLog.count({
        where: {
          createdAt: { gte: today },
          status: { in: ['SENT', 'DELIVERED', 'AWAITING'] },
        },
      })

      remainingToday = settings.dailySendLimit - sentToday
      if (remainingToday <= 0) {
        return NextResponse.json({
          success: true,
          message: 'Daily limit reached',
          processed: 0,
          dailyLimit: settings.dailySendLimit,
          sentToday,
        })
      }
    }

    // Fetch pending SMS logs
    const pendingLogs = await prisma.smsLog.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: remainingToday ?? 1000, // Limit to daily remaining or 1000
    })

    if (pendingLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending SMS',
        processed: 0,
      })
    }

    // Get UBill client
    const client = await getUBillClient()
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Failed to initialize SMS client',
        processed: 0,
      })
    }

    // Group by brandId + message for batch sending
    const batches = new Map<string, typeof pendingLogs>()
    for (const log of pendingLogs) {
      const key = `${log.brandId}:${log.message}`
      if (!batches.has(key)) {
        batches.set(key, [])
      }
      batches.get(key)!.push(log)
    }

    let processed = 0
    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Process each batch
    const batchEntries = Array.from(batches.values())
    for (const batchLogs of batchEntries) {
      const phones = batchLogs.map((l) => l.phone)
      const brandId = batchLogs[0].brandId
      const message = batchLogs[0].message

      try {
        // Send all phones in one API call
        const response = await client.send({
          brandId,
          numbers: phones,
          text: message,
        })

        const status = mapUBillStatusToSmsStatus(response.statusID)
        const isSuccess = response.statusID === UBILL_STATUS.SENT

        // Update all logs in this batch
        await prisma.smsLog.updateMany({
          where: { id: { in: batchLogs.map((l) => l.id) } },
          data: {
            status,
            ubillSmsId: response.smsID ? String(response.smsID) : null,
            error: !isSuccess ? response.message : null,
          },
        })

        // Update contact stats for successful sends
        if (isSuccess) {
          const contactIds = batchLogs
            .filter((l) => l.contactId)
            .map((l) => l.contactId as string)

          if (contactIds.length > 0) {
            await prisma.contact.updateMany({
              where: { id: { in: contactIds } },
              data: {
                lastSmsReceivedAt: new Date(),
                totalSmsReceived: { increment: 1 },
              },
            }).catch((err) => {
              logger.warn('Failed to update contact SMS stats:', err)
            })
          }

          sent += batchLogs.length
        } else {
          failed += batchLogs.length
          errors.push(`Batch failed: ${response.message || 'Unknown error'}`)
        }

        processed += batchLogs.length
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('SMS batch send error:', error)

        // Mark all in batch as ERROR
        await prisma.smsLog.updateMany({
          where: { id: { in: batchLogs.map((l) => l.id) } },
          data: {
            status: 'ERROR',
            error: errorMessage,
          },
        })

        failed += batchLogs.length
        processed += batchLogs.length
        errors.push(`Batch error: ${errorMessage}`)
      }
    }

    logger.info('SMS queue processed:', { processed, sent, failed, batches: batches.size })

    return NextResponse.json({
      success: true,
      message: 'Queue processed',
      processed,
      sent,
      failed,
      batches: batches.size,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit errors in response
    })
  } catch (error) {
    logger.error('SMS queue processor error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for easy testing/manual trigger
export async function GET(request: NextRequest) {
  return POST(request)
}
