// API endpoint for listing all content (images + videos) from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listAllBunnyContent } from '@/lib/storage'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const { images, videos } = await listAllBunnyContent()

    return NextResponse.json({ images, videos })
  } catch (error: any) {
    logger.error('Error listing content library:', error)
    return errorResponse('Failed to list content')
  }
}
