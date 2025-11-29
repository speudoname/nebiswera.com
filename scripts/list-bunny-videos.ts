/**
 * List all videos in Bunny Stream library
 */

// Load environment variables
import { config } from 'dotenv'
config()

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!
const BUNNY_LIBRARY_API_KEY = process.env.BUNNY_LIBRARY_API_KEY!

async function main() {
  console.log('📋 Fetching videos from Bunny Stream...\n')

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos?page=1&itemsPerPage=100`,
      {
        headers: {
          'AccessKey': BUNNY_LIBRARY_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${await response.text()}`)
    }

    const data = await response.json()

    console.log(`Found ${data.totalItems} videos:\n`)

    for (const video of data.items) {
      console.log(`Title: ${video.title}`)
      console.log(`Video ID: ${video.guid}`)
      console.log(`Status: ${getStatusText(video.status)}`)
      console.log(`Length: ${Math.round(video.length)}s`)
      console.log(`HLS URL: https://${process.env.BUNNY_CDN_HOSTNAME}/${video.guid}/playlist.m3u8`)
      console.log(`Thumbnail: https://${process.env.BUNNY_CDN_HOSTNAME}/${video.guid}/thumbnail.jpg`)
      console.log('---')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

function getStatusText(status: number): string {
  const statuses: Record<number, string> = {
    0: 'created',
    1: 'uploading',
    2: 'processing',
    3: 'transcoding',
    4: 'ready',
    5: 'error',
    6: 'upload_failed',
  }
  return statuses[status] || 'unknown'
}

main()
