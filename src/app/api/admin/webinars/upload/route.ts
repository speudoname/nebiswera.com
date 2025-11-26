import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { createDirectUploadUrl, getVideo } from '@/lib/cloudflare-stream'
import type { NextRequest } from 'next/server'

// POST /api/admin/webinars/upload - Get a direct upload URL for Cloudflare Stream
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { webinarId, webinarTitle } = body

    // Create direct upload URL
    // This URL can be used with TUS protocol for resumable uploads
    const { uploadURL, uid } = await createDirectUploadUrl({
      maxDurationSeconds: 3600 * 3, // 3 hours max duration
      meta: {
        webinarId: webinarId || '',
        name: webinarTitle || 'Webinar Video',
      },
      requireSignedURLs: false, // We'll handle access control at our app level
    })

    return NextResponse.json({
      uploadURL,
      videoUid: uid,
    })
  } catch (error) {
    console.error('Failed to create upload URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}

// GET /api/admin/webinars/upload?uid=xxx - Get video status
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')

  if (!uid) {
    return NextResponse.json({ error: 'Video UID required' }, { status: 400 })
  }

  try {
    const video = await getVideo(uid)

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({
      uid: video.uid,
      status: video.status.state,
      pctComplete: video.status.pctComplete,
      readyToStream: video.readyToStream,
      duration: video.duration,
      thumbnail: video.thumbnail,
      playback: video.playback,
      size: video.size,
      dimensions: video.input,
    })
  } catch (error) {
    console.error('Failed to get video status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get video status' },
      { status: 500 }
    )
  }
}
