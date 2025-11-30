// API endpoint for listing email campaign images from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { listFromBunnyStorage } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const images = await listFromBunnyStorage('email-images')

    return NextResponse.json({ images })
  } catch (error: any) {
    console.error('Error listing email images:', error)
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    )
  }
}
