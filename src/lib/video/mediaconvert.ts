// AWS MediaConvert Video Transcoding API Integration
// https://docs.aws.amazon.com/mediaconvert/

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
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_MEDIACONVERT_ENDPOINT = process.env.AWS_MEDIACONVERT_ENDPOINT
const AWS_MEDIACONVERT_ROLE = process.env.AWS_MEDIACONVERT_ROLE
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'nebiswera-videos'

// S3 public URL
const S3_PUBLIC_URL = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`

// Initialize clients
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

const mediaConvertClient = new MediaConvertClient({
  region: AWS_REGION,
  endpoint: AWS_MEDIACONVERT_ENDPOINT,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

export interface MediaConvertJobConfig {
  webinarId: string
  inputUrl: string // Can be S3 URL or HTTPS URL
}

export interface MediaConvertJobResponse {
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
 * - Outputs: HLS with 480p, 720p, 1080p + thumbnail
 * - Storage: S3
 */
export async function createTranscodingJob(config: MediaConvertJobConfig): Promise<MediaConvertJobResponse> {
  if (!AWS_MEDIACONVERT_ROLE) {
    throw new Error('AWS_MEDIACONVERT_ROLE is not configured')
  }

  const outputPath = `s3://${AWS_S3_BUCKET}/processed/${config.webinarId}`

  // Determine input - if it's an HTTPS URL, use it directly, otherwise assume S3
  const inputFileUrl = config.inputUrl.startsWith('s3://')
    ? config.inputUrl
    : config.inputUrl.startsWith('https://')
      ? config.inputUrl
      : `s3://${AWS_S3_BUCKET}/${config.inputUrl}`

  const jobSettings: CreateJobCommandInput = {
    Role: AWS_MEDIACONVERT_ROLE,
    Settings: {
      Inputs: [
        {
          FileInput: inputFileUrl,
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
export async function getJobStatus(jobId: string): Promise<MediaConvertJobResponse> {
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
 * Get the public HLS URL for a webinar
 */
export function getHlsUrl(webinarId: string): string {
  return `${S3_PUBLIC_URL}/processed/${webinarId}/hls/index.m3u8`
}

/**
 * Get the public thumbnail URL for a webinar
 */
export function getThumbnailUrl(webinarId: string): string {
  return `${S3_PUBLIC_URL}/processed/${webinarId}/thumbnail.0000000.jpg`
}

/**
 * Get the S3 URL for original video
 */
export function getOriginalUrl(webinarId: string): string {
  return `${S3_PUBLIC_URL}/originals/${webinarId}/video.mp4`
}
