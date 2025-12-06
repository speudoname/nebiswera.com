// API endpoint for listing all content (images + videos) from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listAllBunnyContent } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { images, videos } = await listAllBunnyContent()

    return NextResponse.json({ images, videos })
  } catch (error: any) {
    logger.error('Error listing content library:', error)
    return NextResponse.json(
      { error: 'Failed to list content' },
      { status: 500 }
    )
  }
}
