// API endpoint for listing email campaign images from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listFromBunnyStorage } from '@/lib/storage'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const images = await listFromBunnyStorage('email-images')

    return NextResponse.json({ images })
  } catch (error) {
    logger.error('Error listing email images:', error)
    return errorResponse('Failed to list images')
  }
}
