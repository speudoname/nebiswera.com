/**
 * Upload hero video from R2 to Bunny Stream
 * This will give us HLS streaming for instant playback
 */

// Load environment variables
import { config } from 'dotenv'
config()

import { uploadVideoByUrl, getBunnyVideo, getVideoStatusText } from '../src/lib/storage/bunny'

const HERO_VIDEO_R2_URL = 'https://cdn.nebiswera.com/hero-video.mp4'
const VIDEO_TITLE = 'Hero Video - Nebiswera VSL'

async function main() {
  console.log('📤 Uploading hero video to Bunny Stream...')
  console.log('Source:', HERO_VIDEO_R2_URL)

  try {
    // Upload video from R2 URL
    const result = await uploadVideoByUrl(VIDEO_TITLE, HERO_VIDEO_R2_URL)

    console.log('\n✅ Video created successfully!')
    console.log('Video ID:', result.videoId)
    console.log('HLS URL:', result.hlsUrl)
    console.log('Thumbnail URL:', result.thumbnailUrl)

    console.log('\n⏳ Bunny is now fetching and processing the video...')
    console.log('This may take several minutes for a 88MB video.')

    // Poll for status
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    while (attempts < maxAttempts) {
      attempts++
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

      const video = await getBunnyVideo(result.videoId)
      const status = getVideoStatusText(video.status)

      console.log(`Status check ${attempts}:`, status, `(${video.encodeProgress}%)`)

      if (video.status === 4) {
        console.log('\n🎉 Video is ready!')
        console.log('\nAdd these to your .env or use directly in HeroVideoPlayer:')
        console.log(`HERO_VIDEO_ID="${result.videoId}"`)
        console.log(`HERO_VIDEO_HLS="${result.hlsUrl}"`)
        console.log(`HERO_VIDEO_THUMBNAIL="${result.thumbnailUrl}"`)
        break
      }

      if (video.status === 5 || video.status === 6) {
        console.error('\n❌ Video processing failed!')
        process.exit(1)
      }
    }

    if (attempts >= maxAttempts) {
      console.log('\n⚠️  Polling timeout. Video is still processing.')
      console.log('Check status later using video ID:', result.videoId)
    }

  } catch (error) {
    console.error('\n❌ Failed to upload video:', error)
    process.exit(1)
  }
}

main()
