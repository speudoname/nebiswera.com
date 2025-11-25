import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { findAllDuplicates, findDuplicatesForImport } from '@/lib/duplicate-detection'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await findAllDuplicates()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to find duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json(
        { error: 'Contacts array is required' },
        { status: 400 }
      )
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
    console.error('Failed to check duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}
