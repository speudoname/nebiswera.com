// API endpoint for listing webinar media from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listFromBunnyStorage } from '@/lib/storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
    return errorResponse('Failed to list media')
  }
}
