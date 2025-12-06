/**
 * Admin Facebook Pixel Event Logs API
 * View and filter event logs for debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getEventLogs, getEventLogDetails } from '@/lib/pixel'

// GET - Fetch event logs with filtering
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const eventName = searchParams.get('eventName') || undefined
    const source = searchParams.get('source') as 'client' | 'server' | undefined
    const status = searchParams.get('status') as 'sent' | 'failed' | 'test' | undefined
    const pageType = searchParams.get('pageType') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined

    // Check if requesting a specific log details
    const logId = searchParams.get('id')
    if (logId) {
      const logDetails = await getEventLogDetails(logId)
      if (!logDetails) {
        return NextResponse.json(
          { error: 'Log not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(logDetails)
    }

    // Get paginated logs
    const result = await getEventLogs({
      page,
      limit,
      eventName,
      source,
      status,
      pageType,
      startDate,
      endDate,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Pixel Logs API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event logs' },
      { status: 500 }
    )
  }
}

// DELETE - Clear old logs (manual cleanup)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '7', 10)

    // Import cleanup function
    const { cleanupOldEventLogs } = await import('@/lib/pixel')
    const deletedCount = await cleanupOldEventLogs(daysToKeep)

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} logs older than ${daysToKeep} days`,
    })
  } catch (error) {
    console.error('[Pixel Logs API] Delete Error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup logs' },
      { status: 500 }
    )
  }
}
