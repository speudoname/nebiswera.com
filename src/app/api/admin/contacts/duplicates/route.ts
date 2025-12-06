import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { findAllDuplicates, findDuplicatesForImport } from '@/app/api/admin/contacts/lib/duplicate-detection'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const result = await findAllDuplicates()
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Failed to find duplicates:', error)
    return errorResponse('Failed to find duplicates')
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { contacts } = body as {
      contacts: Array<{
        email: string
        firstName?: string
        lastName?: string
        phone?: string
      }>
    }

    if (!contacts || !Array.isArray(contacts)) {
      return badRequestResponse('Contacts array is required')
    }

    const duplicateMap = await findDuplicatesForImport(contacts)

    const result: Array<{
      index: number
      email: string
      duplicates: Array<{
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        matchType: string
        matchScore: number
      }>
    }> = []

    duplicateMap.forEach((duplicates, index) => {
      result.push({
        index,
        email: contacts[index].email,
        duplicates,
      })
    })

    return NextResponse.json({
      hasDuplicates: result.length > 0,
      duplicateCount: result.length,
      duplicates: result,
    })
  } catch (error) {
    logger.error('Failed to check duplicates:', error)
    return errorResponse('Failed to check duplicates')
  }
}
