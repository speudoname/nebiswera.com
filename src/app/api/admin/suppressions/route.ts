import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { syncSuppressions, getSuppressionDump } from '@/lib/suppression-sync'
import type { NextRequest } from 'next/server'

/**
 * GET /api/admin/suppressions - Get suppression stats
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dump = await getSuppressionDump()
    return NextResponse.json(dump)
  } catch (error) {
    console.error('Failed to get suppression stats:', error)
    return NextResponse.json(
      { error: 'Failed to get suppression stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/suppressions - Trigger bidirectional sync
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncSuppressions()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Suppression sync failed:', error)
    return NextResponse.json(
      { error: 'Suppression sync failed' },
      { status: 500 }
    )
  }
}
