// API endpoint for listing blog post images from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listFromBunnyStorage } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const images = await listFromBunnyStorage('blog-images')

    return NextResponse.json({ images })
  } catch (error: unknown) {
    logger.error('Error listing blog images:', error)
    return errorResponse('Failed to list images')
  }
}
