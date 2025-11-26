/**
 * Video Transcoding Worker
 *
 * Polls database for PENDING video processing jobs
 * Downloads original from R2, transcodes with FFmpeg, uploads HLS to R2
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import http from 'http'

// Configuration
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '10000') // 10 seconds
const WORK_DIR = process.env.WORK_DIR || '/tmp/video-worker'
const PORT = parseInt(process.env.PORT || '3001')

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.nebiswera.com'

// Validate environment
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Missing R2 credentials!')
  process.exit(1)
}

// Initialize Prisma
const prisma = new PrismaClient()

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// Quality presets
const QUALITY_PRESETS = [
  { name: '1080p', height: 1080, bitrate: '5000k', audioBitrate: '128k', crf: 22 },
  { name: '720p', height: 720, bitrate: '2500k', audioBitrate: '128k', crf: 23 },
  { name: '480p', height: 480, bitrate: '1000k', audioBitrate: '96k', crf: 24 },
]

let isShuttingDown = false
let currentJobId = null

/**
 * Get video info using ffprobe
 */
async function getVideoInfo(inputPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration',
      '-of', 'json',
      inputPath
    ])

    let output = ''
    let error = ''

    ffprobe.stdout.on('data', (data) => output += data)
    ffprobe.stderr.on('data', (data) => error += data)

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${error}`))
        return
      }

      try {
        const data = JSON.parse(output)
        const stream = data.streams?.[0]
        if (!stream) {
          reject(new Error('No video stream found'))
          return
        }

        resolve({
          width: parseInt(stream.width),
          height: parseInt(stream.height),
          duration: parseFloat(stream.duration) || 0,
        })
      } catch (e) {
        reject(new Error(`Failed to parse ffprobe output: ${e.message}`))
      }
    })
  })
}

/**
 * Transcode video to a specific quality
 */
async function transcodeQuality(inputPath, outputDir, quality, onProgress) {
  const qualityDir = path.join(outputDir, quality.name)
  await fs.mkdir(qualityDir, { recursive: true })

  const playlistPath = path.join(qualityDir, 'playlist.m3u8')
  const segmentPattern = path.join(qualityDir, 'segment-%03d.ts')

  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-vf', `scale=-2:${quality.height}`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', quality.crf.toString(),
      '-c:a', 'aac',
      '-b:a', quality.audioBitrate,
      '-hls_time', '6',
      '-hls_list_size', '0',
      '-hls_segment_filename', segmentPattern,
      '-y',
      playlistPath
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let lastProgress = 0

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString()
      // Parse progress from ffmpeg output
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
      if (timeMatch) {
        const hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])
        const seconds = parseInt(timeMatch[3])
        const currentTime = hours * 3600 + minutes * 60 + seconds
        if (onProgress && currentTime > lastProgress) {
          lastProgress = currentTime
          onProgress(currentTime)
        }
      }
    })

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed with code ${code}`))
      } else {
        resolve(playlistPath)
      }
    })

    ffmpeg.on('error', reject)
  })
}

/**
 * Generate thumbnail from video
 */
async function generateThumbnail(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-ss', '00:00:05',
      '-vframes', '1',
      '-vf', 'scale=640:360',
      '-y',
      outputPath
    ])

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Thumbnail generation failed with code ${code}`))
      } else {
        resolve(outputPath)
      }
    })

    ffmpeg.on('error', reject)
  })
}

/**
 * Create master playlist
 */
async function createMasterPlaylist(outputDir, qualities) {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n'

  // Sort by bitrate descending
  const sortedQualities = [...qualities].sort((a, b) =>
    parseInt(b.bitrate) - parseInt(a.bitrate)
  )

  for (const q of sortedQualities) {
    const bandwidth = parseInt(q.bitrate) * 1000
    const resolution = q.height === 1080 ? '1920x1080' :
                       q.height === 720 ? '1280x720' : '854x480'

    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`
    content += `${q.name}/playlist.m3u8\n\n`
  }

  const masterPath = path.join(outputDir, 'master.m3u8')
  await fs.writeFile(masterPath, content)
  return masterPath
}

/**
 * Upload file to R2
 */
async function uploadToR2(localPath, r2Key, contentType) {
  const fileStream = createReadStream(localPath)
  const stat = await fs.stat(localPath)

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileStream,
      ContentType: contentType,
    },
  })

  await upload.done()
  return `${R2_PUBLIC_URL}/${r2Key}`
}

/**
 * Upload directory to R2 recursively
 */
async function uploadDirectoryToR2(localDir, r2Prefix) {
  const entries = await fs.readdir(localDir, { withFileTypes: true })

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name)
    const r2Key = `${r2Prefix}/${entry.name}`

    if (entry.isDirectory()) {
      await uploadDirectoryToR2(localPath, r2Key)
    } else {
      let contentType = 'application/octet-stream'
      if (entry.name.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl'
      else if (entry.name.endsWith('.ts')) contentType = 'video/MP2T'
      else if (entry.name.endsWith('.jpg')) contentType = 'image/jpeg'

      await uploadToR2(localPath, r2Key, contentType)
    }
  }
}

/**
 * Download file from R2
 */
async function downloadFromR2(r2Key, localPath) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
  })

  const response = await s3Client.send(command)
  const writeStream = createWriteStream(localPath)
  await pipeline(response.Body, writeStream)
}

/**
 * Process a single job
 */
async function processJob(job) {
  const jobDir = path.join(WORK_DIR, job.id)
  const outputDir = path.join(jobDir, 'output')

  console.log(`[${job.id}] Starting job for webinar ${job.webinarId}`)

  try {
    // Create working directories
    await fs.mkdir(jobDir, { recursive: true })
    await fs.mkdir(outputDir, { recursive: true })

    // Update job status to PROCESSING
    await prisma.videoProcessingJob.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        error: null,
      },
    })

    // Extract R2 key from URL
    const originalUrl = job.originalUrl
    const r2Key = originalUrl.replace(R2_PUBLIC_URL + '/', '')
    const inputPath = path.join(jobDir, 'original.mp4')

    console.log(`[${job.id}] Downloading original from R2: ${r2Key}`)
    await downloadFromR2(r2Key, inputPath)
    console.log(`[${job.id}] Download complete`)

    // Get video info
    const videoInfo = await getVideoInfo(inputPath)
    console.log(`[${job.id}] Video info:`, videoInfo)

    // Determine which qualities to generate based on source resolution
    const qualitiesToGenerate = QUALITY_PRESETS.filter(q => q.height <= videoInfo.height)

    // If source is very small, at least generate 480p
    if (qualitiesToGenerate.length === 0) {
      qualitiesToGenerate.push(QUALITY_PRESETS[QUALITY_PRESETS.length - 1])
    }

    console.log(`[${job.id}] Generating qualities:`, qualitiesToGenerate.map(q => q.name))

    // Transcode each quality
    let completedQualities = 0
    const totalQualities = qualitiesToGenerate.length

    for (const quality of qualitiesToGenerate) {
      console.log(`[${job.id}] Transcoding ${quality.name}...`)

      const startTime = Date.now()
      await transcodeQuality(inputPath, outputDir, quality, async (currentSeconds) => {
        // Update progress
        const qualityProgress = videoInfo.duration > 0
          ? Math.min(100, (currentSeconds / videoInfo.duration) * 100)
          : 0
        const overallProgress = Math.round(
          ((completedQualities + qualityProgress / 100) / totalQualities) * 100
        )

        await prisma.videoProcessingJob.update({
          where: { id: job.id },
          data: { progress: overallProgress },
        }).catch(() => {}) // Ignore update errors during progress
      })

      completedQualities++
      console.log(`[${job.id}] ${quality.name} complete (${Math.round((Date.now() - startTime) / 1000)}s)`)
    }

    // Generate thumbnail
    console.log(`[${job.id}] Generating thumbnail...`)
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg')
    await generateThumbnail(inputPath, thumbnailPath)

    // Create master playlist
    console.log(`[${job.id}] Creating master playlist...`)
    await createMasterPlaylist(outputDir, qualitiesToGenerate)

    // Upload everything to R2
    console.log(`[${job.id}] Uploading to R2...`)
    const r2OutputPrefix = `webinars/processed/${job.webinarId}`
    await uploadDirectoryToR2(outputDir, r2OutputPrefix)

    const hlsUrl = `${R2_PUBLIC_URL}/${r2OutputPrefix}/master.m3u8`
    const thumbnailUrl = `${R2_PUBLIC_URL}/${r2OutputPrefix}/thumbnail.jpg`

    console.log(`[${job.id}] Upload complete`)
    console.log(`[${job.id}] HLS URL: ${hlsUrl}`)

    // Update job as completed
    await prisma.videoProcessingJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
        hlsUrl,
        thumbnailUrl,
        duration: Math.round(videoInfo.duration),
      },
    })

    // Update webinar
    await prisma.webinar.update({
      where: { id: job.webinarId },
      data: {
        hlsUrl,
        thumbnailUrl,
        videoDuration: Math.round(videoInfo.duration),
        videoStatus: 'ready',
      },
    })

    console.log(`[${job.id}] Job completed successfully`)

  } catch (error) {
    console.error(`[${job.id}] Job failed:`, error)

    // Update job as failed
    await prisma.videoProcessingJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        error: error.message,
        retryCount: { increment: 1 },
      },
    })

    // Update webinar status
    await prisma.webinar.update({
      where: { id: job.webinarId },
      data: {
        videoStatus: 'failed',
      },
    })

  } finally {
    // Clean up working directory
    try {
      await fs.rm(jobDir, { recursive: true, force: true })
    } catch (e) {
      console.error(`[${job.id}] Cleanup error:`, e)
    }
    currentJobId = null
  }
}

/**
 * Poll for pending jobs
 */
async function pollForJobs() {
  if (isShuttingDown || currentJobId) {
    return
  }

  try {
    // Find oldest pending job
    const job = await prisma.videoProcessingJob.findFirst({
      where: {
        status: 'PENDING',
        retryCount: { lt: 3 }, // Max 3 retries
      },
      orderBy: { createdAt: 'asc' },
    })

    if (job) {
      currentJobId = job.id
      await processJob(job)
    }
  } catch (error) {
    console.error('Error polling for jobs:', error)
  }
}

/**
 * Start the worker
 */
async function start() {
  console.log('='.repeat(50))
  console.log('Video Worker Starting')
  console.log('='.repeat(50))
  console.log(`R2 Bucket: ${R2_BUCKET_NAME}`)
  console.log(`Work Directory: ${WORK_DIR}`)
  console.log(`Poll Interval: ${POLL_INTERVAL}ms`)
  console.log('='.repeat(50))

  // Create work directory
  await fs.mkdir(WORK_DIR, { recursive: true })

  // Create a simple health check server
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'healthy',
        currentJob: currentJobId,
        isShuttingDown,
      }))
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  server.listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`)
  })

  // Start polling
  console.log('Starting job poll loop...')

  const pollLoop = setInterval(pollForJobs, POLL_INTERVAL)

  // Handle shutdown
  const shutdown = async () => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log('\nShutting down gracefully...')
    clearInterval(pollLoop)
    server.close()

    // Wait for current job to complete (up to 5 minutes)
    const maxWait = 5 * 60 * 1000
    const startTime = Date.now()

    while (currentJobId && Date.now() - startTime < maxWait) {
      console.log(`Waiting for job ${currentJobId} to complete...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    await prisma.$disconnect()
    console.log('Shutdown complete')
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Initial poll
  await pollForJobs()
}

// Start the worker
start().catch((error) => {
  console.error('Worker failed to start:', error)
  process.exit(1)
})
