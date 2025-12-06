// API endpoint for deleting email campaign images from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { deleteFromBunnyStorage } from '@/lib/storage'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const { key } = await params
    const decodedKey = decodeURIComponent(key)

    // Security check: only allow deleting from email-images folder
    if (!decodedKey.startsWith('email-images/')) {
      return badRequestResponse('Invalid key: can only delete from email-images folder')
    }

    await deleteFromBunnyStorage(decodedKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting email image:', error)
    return errorResponse('Failed to delete image')
  }
}
