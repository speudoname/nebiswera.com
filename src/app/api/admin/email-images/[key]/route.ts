// API endpoint for deleting email campaign images from Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { deleteFromBunnyStorage } from '@/lib/bunny-storage'
import { isAdmin } from '@/lib/auth/utils'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { key } = await params
    const decodedKey = decodeURIComponent(key)

    // Security check: only allow deleting from email-images folder
    if (!decodedKey.startsWith('email-images/')) {
      return NextResponse.json(
        { error: 'Invalid key: can only delete from email-images folder' },
        { status: 400 }
      )
    }

    await deleteFromBunnyStorage(decodedKey)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting email image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
