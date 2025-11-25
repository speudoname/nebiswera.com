import { NextResponse } from 'next/server'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { mergeContacts } from '@/lib/duplicate-detection'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { primaryId, secondaryId } = body as {
      primaryId: string
      secondaryId: string
    }

    if (!primaryId || !secondaryId) {
      return NextResponse.json(
        { error: 'Both primaryId and secondaryId are required' },
        { status: 400 }
      )
    }

    if (primaryId === secondaryId) {
      return NextResponse.json(
        { error: 'Cannot merge a contact with itself' },
        { status: 400 }
      )
    }

    const result = await mergeContacts(primaryId, secondaryId, token?.sub)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Merge failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to merge contacts:', error)
    return NextResponse.json(
      { error: 'Failed to merge contacts' },
      { status: 500 }
    )
  }
}
