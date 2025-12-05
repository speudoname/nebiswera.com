// API endpoint for listing blog post images from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listFromBunnyStorage } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const images = await listFromBunnyStorage('blog-images')

    return NextResponse.json({ images })
  } catch (error: unknown) {
    logger.error('Error listing blog images:', error)
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    )
  }
}
