// API endpoint for listing webinar media from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listFromBunnyStorage } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'images' // 'images' or 'videos'

  try {
    const media = await listFromBunnyStorage(`webinar-media/${type}`)

    return NextResponse.json({ media })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // If folder doesn't exist yet (404 from Bunny), return empty array
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return NextResponse.json({ media: [] })
    }

    logger.error('Error listing webinar media:', error)
    return NextResponse.json(
      { error: 'Failed to list media' },
      { status: 500 }
    )
  }
}
