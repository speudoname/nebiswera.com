import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { getUBillClient, mapUBillStatusToSmsStatus } from '@/lib/sms'

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/check-sms-status
 * Check delivery status of sent SMS messages
 *
 * This cron job:
 * 1. Fetches SMS logs with status SENT or AWAITING that have ubillSmsId
 * 2. Checks their delivery status via UBill API
 * 3. Updates the status in our database
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get UBill client
    const client = await getUBillClient()
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'SMS not configured',
        checked: 0,
      })
    }

    // Fetch SMS logs that need status check
    // Only check messages sent in the last 24 hours that haven't been checked recently
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const thirtyMinutesAgo = new Date()
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

    const logsToCheck = await prisma.smsLog.findMany({
      where: {
        status: { in: ['SENT', 'AWAITING'] },
        ubillSmsId: { not: null },
        createdAt: { gte: oneDayAgo },
        OR: [
          { statusCheckedAt: null },
          { statusCheckedAt: { lt: thirtyMinutesAgo } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Process in batches of 100
    })

    if (logsToCheck.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No SMS to check',
        checked: 0,
      })
    }

    // Group by ubillSmsId (multiple numbers can share same ID)
    const smsIdGroups = new Map<string, typeof logsToCheck>()
    for (const log of logsToCheck) {
      const smsId = log.ubillSmsId!
      if (!smsIdGroups.has(smsId)) {
        smsIdGroups.set(smsId, [])
      }
      smsIdGroups.get(smsId)!.push(log)
    }

    let checked = 0
    let updated = 0
    const errors: string[] = []

    // Check status for each unique smsId
    const smsIdEntries = Array.from(smsIdGroups.entries())
    for (const [smsId, logs] of smsIdEntries) {
      try {
        const report = await client.getReport(smsId)

        // Update statusCheckedAt for all logs
        await prisma.smsLog.updateMany({
          where: { id: { in: logs.map((l) => l.id) } },
          data: { statusCheckedAt: new Date() },
        })

        checked += logs.length

        if (report.statusID !== 0 || !report.result) {
          // Report fetch failed or no results
          continue
        }

        // Create a map of phone -> status from the report
        const statusByPhone = new Map<string, string>()
        for (const result of report.result) {
          statusByPhone.set(result.number, result.statusID)
        }

        // Update each log based on its phone number's status
        for (const log of logs) {
          const phoneStatus = statusByPhone.get(log.phone)
          if (phoneStatus !== undefined) {
            const newStatus = mapUBillStatusToSmsStatus(phoneStatus)

            // Only update if status changed
            if (newStatus !== log.status) {
              await prisma.smsLog.update({
                where: { id: log.id },
                data: { status: newStatus },
              })
              updated++
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`SMS status check error for smsId ${smsId}:`, error)
        errors.push(`smsId ${smsId}: ${errorMessage}`)
      }
    }

    logger.info('SMS status check completed:', { checked, updated, groups: smsIdGroups.size })

    return NextResponse.json({
      success: true,
      message: 'Status check completed',
      checked,
      updated,
      groups: smsIdGroups.size,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    })
  } catch (error) {
    logger.error('SMS status checker error:', error)
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
