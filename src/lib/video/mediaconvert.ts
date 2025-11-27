// AWS MediaConvert Video Transcoding with R2 Delivery
// Flow: Upload to S3 → MediaConvert transcodes → Copy to R2 → Serve from R2 (free bandwidth)

import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
  type CreateJobCommandInput,
} from '@aws-sdk/client-mediaconvert'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_MEDIACONVERT_ENDPOINT = process.env.AWS_MEDIACONVERT_ENDPOINT
const AWS_MEDIACONVERT_ROLE = process.env.AWS_MEDIACONVERT_ROLE
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'nebiswera-videos'

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.nebiswera.com'

// Initialize S3 client for AWS
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
})

// Initialize MediaConvert client
const mediaConvertClient = new MediaConvertClient({
  region: AWS_REGION,
  endpoint: AWS_MEDIACONVERT_ENDPOINT,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

export interface TranscodingJobConfig {
  webinarId: string
  inputUrl: string // S3 URL of original video
}

export interface TranscodingJobResponse {
  id: string
  status: string
  progress: number
  createdAt?: string
  completedAt?: string
  errorMessage?: string
}

/**
 * Create a presigned URL for uploading video to S3
 */
export async function createPresignedUploadUrl(
  webinarId: string,
  contentType: string = 'video/mp4',
  expiresIn: number = 7200
): Promise<{ uploadUrl: string; s3Key: string; s3Url: string }> {
  const s3Key = `originals/${webinarId}/video.mp4`

  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
  const s3Url = `s3://${AWS_S3_BUCKET}/${s3Key}`

  return { uploadUrl, s3Key, s3Url }
}

/**
 * Create a transcoding job with AWS MediaConvert
 * Outputs HLS with 480p, 720p, 1080p + thumbnail to S3
 */
export async function createTranscodingJob(config: TranscodingJobConfig): Promise<TranscodingJobResponse> {
  if (!AWS_MEDIACONVERT_ROLE) {
    throw new Error('AWS_MEDIACONVERT_ROLE is not configured')
  }

  const outputPath = `s3://${AWS_S3_BUCKET}/processed/${config.webinarId}`

  const jobSettings: CreateJobCommandInput = {
    Role: AWS_MEDIACONVERT_ROLE,
    Settings: {
      Inputs: [
        {
          FileInput: config.inputUrl,
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT',
            },
          },
          VideoSelector: {},
          TimecodeSource: 'ZEROBASED',
        },
      ],
      OutputGroups: [
        // HLS Output Group
        {
          Name: 'HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              Destination: `${outputPath}/hls/`,
              SegmentLength: 6,
              MinSegmentLength: 0,
            },
          },
          Outputs: [
            // 480p
            {
              NameModifier: '_480p',
              VideoDescription: {
                Width: 854,
                Height: 480,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    QvbrSettings: {
                      QvbrQualityLevel: 7,
                    },
                    MaxBitrate: 1000000,
                  },
                },
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 96000,
                      CodingMode: 'CODING_MODE_2_0',
                      SampleRate: 48000,
                    },
                  },
                },
              ],
              ContainerSettings: {
                Container: 'M3U8',
              },
            },
            // 720p
            {
              NameModifier: '_720p',
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    QvbrSettings: {
                      QvbrQualityLevel: 8,
                    },
                    MaxBitrate: 2500000,
                  },
                },
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 128000,
                      CodingMode: 'CODING_MODE_2_0',
                      SampleRate: 48000,
                    },
                  },
                },
              ],
              ContainerSettings: {
                Container: 'M3U8',
              },
            },
            // 1080p
            {
              NameModifier: '_1080p',
              VideoDescription: {
                Width: 1920,
                Height: 1080,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    QvbrSettings: {
                      QvbrQualityLevel: 9,
                    },
                    MaxBitrate: 5000000,
                  },
                },
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 192000,
                      CodingMode: 'CODING_MODE_2_0',
                      SampleRate: 48000,
                    },
                  },
                },
              ],
              ContainerSettings: {
                Container: 'M3U8',
              },
            },
          ],
        },
        // Thumbnail Output Group
        {
          Name: 'Thumbnails',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `${outputPath}/`,
            },
          },
          Outputs: [
            {
              NameModifier: 'thumbnail',
              VideoDescription: {
                Width: 640,
                Height: 360,
                CodecSettings: {
                  Codec: 'FRAME_CAPTURE',
                  FrameCaptureSettings: {
                    FramerateNumerator: 1,
                    FramerateDenominator: 10,
                    MaxCaptures: 1,
                    Quality: 80,
                  },
                },
              },
              ContainerSettings: {
                Container: 'RAW',
              },
            },
          ],
        },
      ],
    },
    UserMetadata: {
      webinarId: config.webinarId,
    },
  }

  const command = new CreateJobCommand(jobSettings)
  const response = await mediaConvertClient.send(command)

  return {
    id: response.Job?.Id || '',
    status: response.Job?.Status || 'SUBMITTED',
    progress: 0,
    createdAt: response.Job?.CreatedAt?.toISOString(),
  }
}

/**
 * Get job status from MediaConvert
 */
export async function getJobStatus(jobId: string): Promise<TranscodingJobResponse> {
  const command = new GetJobCommand({ Id: jobId })
  const response = await mediaConvertClient.send(command)

  const job = response.Job

  // Calculate progress based on status
  let progress = 0
  if (job?.Status === 'COMPLETE') {
    progress = 100
  } else if (job?.Status === 'PROGRESSING' && job?.JobPercentComplete) {
    progress = job.JobPercentComplete
  }

  return {
    id: job?.Id || jobId,
    status: job?.Status || 'UNKNOWN',
    progress,
    createdAt: job?.CreatedAt?.toISOString(),
    completedAt: job?.Status === 'COMPLETE' ? new Date().toISOString() : undefined,
    errorMessage: job?.ErrorMessage,
  }
}

/**
 * Copy all transcoded files from S3 to R2
 * This is called after MediaConvert job completes
 */
export async function copyTranscodedToR2(webinarId: string): Promise<{ hlsUrl: string; thumbnailUrl: string }> {
  const s3Prefix = `processed/${webinarId}/`
  const r2Prefix = `webinars/processed/${webinarId}/`

  console.log(`Copying transcoded files from S3 to R2 for webinar: ${webinarId}`)

  // List all files in S3 processed folder
  const listCommand = new ListObjectsV2Command({
    Bucket: AWS_S3_BUCKET,
    Prefix: s3Prefix,
  })

  const listResponse = await s3Client.send(listCommand)

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    throw new Error(`No transcoded files found in S3 for webinar: ${webinarId}`)
  }

  console.log(`Found ${listResponse.Contents.length} files to copy`)

  // Copy each file from S3 to R2
  for (const object of listResponse.Contents) {
    if (!object.Key) continue

    // Get the file from S3
    const getCommand = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: object.Key,
    })

    const getResponse = await s3Client.send(getCommand)

    if (!getResponse.Body) continue

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const stream = getResponse.Body as AsyncIterable<Uint8Array>
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Determine R2 key (replace S3 prefix with R2 prefix)
    const r2Key = object.Key.replace(s3Prefix, r2Prefix)

    // Determine content type
    let contentType = 'application/octet-stream'
    if (r2Key.endsWith('.m3u8')) {
      contentType = 'application/vnd.apple.mpegurl'
    } else if (r2Key.endsWith('.ts')) {
      contentType = 'video/mp2t'
    } else if (r2Key.endsWith('.jpg') || r2Key.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (r2Key.endsWith('.mp4')) {
      contentType = 'video/mp4'
    }

    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    })

    await r2Client.send(putCommand)
    console.log(`Copied: ${object.Key} → ${r2Key}`)
  }

  console.log(`Finished copying files to R2 for webinar: ${webinarId}`)

  // Return R2 URLs
  return {
    hlsUrl: getHlsUrl(webinarId),
    thumbnailUrl: getThumbnailUrl(webinarId),
  }
}

/**
 * Get the public HLS URL for a webinar (from R2)
 */
export function getHlsUrl(webinarId: string): string {
  return `${R2_PUBLIC_URL}/webinars/processed/${webinarId}/hls/index.m3u8`
}

/**
 * Get the public thumbnail URL for a webinar (from R2)
 */
export function getThumbnailUrl(webinarId: string): string {
  return `${R2_PUBLIC_URL}/webinars/processed/${webinarId}/thumbnail.0000000.jpg`
}

/**
 * Get the S3 URL for original video
 */
export function getOriginalS3Url(webinarId: string): string {
  return `s3://${AWS_S3_BUCKET}/originals/${webinarId}/video.mp4`
}
