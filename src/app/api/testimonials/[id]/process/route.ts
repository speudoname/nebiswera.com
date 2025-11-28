import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  uploadVideoToS3,
  createTranscodingJob,
  getJobStatus,
  copyTranscodedToR2,
} from '@/lib/video/mediaconvert'

// POST /api/testimonials/[id]/process - Start transcoding for a testimonial video
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get testimonial with video URL
    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    if (!testimonial.videoUrl) {
      return NextResponse.json({ error: 'No video URL found' }, { status: 400 })
    }

    // Fetch video from R2 and upload to S3 for processing
    console.log(`Fetching video from R2: ${testimonial.videoUrl}`)
    const videoResponse = await fetch(testimonial.videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status}`)
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    const contentType = videoResponse.headers.get('content-type') || 'video/webm'

    // Upload to S3
    console.log(`Uploading video to S3 for testimonial: ${id}`)
    const s3Url = await uploadVideoToS3(id, videoBuffer, contentType, 'testimonial')

    // Update testimonial status
    await prisma.testimonial.update({
      where: { id },
      data: { videoStatus: 'processing' },
    })

    // Create transcoding job
    console.log(`Creating transcoding job for testimonial: ${id}`)
    const transcodingJob = await createTranscodingJob({
      testimonialId: id,
      videoType: 'testimonial',
      inputUrl: s3Url,
    })

    return NextResponse.json({
      success: true,
      testimonialId: id,
      transcodingJobId: transcodingJob.id,
      status: 'processing',
      message: 'Video is being transcoded by AWS MediaConvert.',
    })
  } catch (error) {
    console.error('Failed to start transcoding:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start transcoding' },
      { status: 500 }
    )
  }
}

// GET /api/testimonials/[id]/process - Check transcoding status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url)
  const jobId = url.searchParams.get('jobId')

  try {
    const { id } = await params

    if (!jobId) {
      // Just return the testimonial status
      const testimonial = await prisma.testimonial.findUnique({
        where: { id },
        select: {
          videoStatus: true,
          hlsUrl: true,
          videoThumbnail: true,
        },
      })

      if (!testimonial) {
        return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
      }

      return NextResponse.json({
        testimonialId: id,
        status: testimonial.videoStatus || 'pending',
        hlsUrl: testimonial.hlsUrl,
        thumbnailUrl: testimonial.videoThumbnail,
      })
    }

    // Poll MediaConvert for status
    const mcStatus = await getJobStatus(jobId)
    console.log(`MediaConvert status for ${jobId}: ${mcStatus.status}, progress: ${mcStatus.progress}%`)

    if (mcStatus.status === 'COMPLETE') {
      console.log(`MediaConvert job completed for testimonial: ${id}. Copying to R2...`)

      // Copy transcoded files from S3 to R2
      const { hlsUrl, thumbnailUrl } = await copyTranscodedToR2(id, 'testimonial')

      // Update testimonial
      await prisma.testimonial.update({
        where: { id },
        data: {
          videoStatus: 'ready',
          hlsUrl,
          videoThumbnail: thumbnailUrl,
        },
      })

      console.log(`Video ready for testimonial: ${id}`)

      return NextResponse.json({
        testimonialId: id,
        status: 'ready',
        progress: 100,
        hlsUrl,
        thumbnailUrl,
      })
    }

    if (mcStatus.status === 'ERROR' || mcStatus.status === 'CANCELED') {
      await prisma.testimonial.update({
        where: { id },
        data: { videoStatus: 'error' },
      })

      return NextResponse.json({
        testimonialId: id,
        status: 'error',
        progress: mcStatus.progress,
        error: mcStatus.errorMessage || 'Transcoding failed',
      })
    }

    // Still processing
    return NextResponse.json({
      testimonialId: id,
      status: 'processing',
      progress: mcStatus.progress,
    })
  } catch (error) {
    console.error('Failed to get transcoding status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
