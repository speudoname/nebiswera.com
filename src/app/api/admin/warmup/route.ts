import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import {
  unauthorizedResponse,
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/api-response'
import {
  getWarmupState,
  startWarmup,
  getContactCountsByTier,
  estimateDaysToComplete,
} from '@/lib/warmup'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

// GET /api/admin/warmup - Get warmup status
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const state = await getWarmupState()
    const tierCounts = await getContactCountsByTier()

    // Calculate total contacts
    const totalContacts = Object.values(tierCounts).reduce((a, b) => a + b, 0)

    return successResponse({
      ...state,
      tierCounts,
      totalContacts,
    })
  } catch (error) {
    logger.error('Failed to get warmup status:', error)
    return errorResponse('Failed to get warmup status')
  }
}

// POST /api/admin/warmup - Start warmup
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action !== 'start') {
      return badRequestResponse('Invalid action. Use "start" to begin warmup.')
    }

    const config = await startWarmup()

    // Get tier counts for response
    const tierCounts = await getContactCountsByTier()
    const totalContacts = Object.values(tierCounts).reduce((a, b) => a + b, 0)

    // Estimate completion time
    const estimatedDays = estimateDaysToComplete(totalContacts, 1)

    return successResponse({
      message: 'Warmup started successfully',
      config,
      estimatedDays,
    })
  } catch (error) {
    logger.error('Failed to start warmup:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to start warmup'
    )
  }
}
