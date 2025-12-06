import { NextResponse } from 'next/server'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { mergeContacts } from '@/app/api/admin/contacts/lib/duplicate-detection'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { primaryId, secondaryId } = body as {
      primaryId: string
      secondaryId: string
    }

    if (!primaryId || !secondaryId) {
      return badRequestResponse('Both primaryId and secondaryId are required')
    }

    if (primaryId === secondaryId) {
      return badRequestResponse('Cannot merge a contact with itself')
    }

    const result = await mergeContacts(primaryId, secondaryId, token?.sub)

    if (!result.success) {
      return badRequestResponse(result.error || 'Merge failed')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to merge contacts:', error)
    return errorResponse('Failed to merge contacts')
  }
}
