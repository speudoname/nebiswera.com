/**
 * Video Tab Component
 *
 * Handles video upload, HLS URL management, and video metadata
 */

'use client'

import { Card, Input, Button } from '@/components/ui'
import { VideoUploader } from '../VideoUploader'

interface WebinarData {
  title: string
  hlsUrl?: string
  videoDuration?: number
  thumbnailUrl?: string
  videoStatus?: string
}

interface VideoTabProps {
  data: WebinarData
  onChange: (field: keyof WebinarData, value: string | number) => void
  webinarId?: string
  onSave: () => Promise<void>
}

export function VideoTab({ data, onChange, webinarId, onSave }: VideoTabProps) {
  const handleUploadComplete = async (videoData: {
    bunnyVideoId: string
    duration: number
    thumbnail: string
    hlsUrl: string
  }) => {
    onChange('hlsUrl', videoData.hlsUrl)
    onChange('videoDuration', videoData.duration)
    onChange('thumbnailUrl', videoData.thumbnail)
    onChange('videoStatus', 'ready')

    // Auto-save after video upload
    await onSave()
  }

  const hasVideo = !!data.hlsUrl
  const isProcessing = data.videoStatus === 'processing'

  return (
    <Card variant="raised" padding="lg">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Webinar Video</h3>

      {/* Video status badge */}
      {data.videoStatus && (
        <div className="mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.videoStatus === 'ready'
                ? 'bg-green-100 text-green-700'
                : data.videoStatus === 'processing'
                ? 'bg-yellow-100 text-yellow-700'
                : data.videoStatus === 'failed'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {data.videoStatus === 'ready' && 'Video Ready'}
            {data.videoStatus === 'processing' && 'Processing...'}
            {data.videoStatus === 'failed' && 'Processing Failed'}
          </span>
        </div>
      )}

      {hasVideo && !isProcessing ? (
        <div className="space-y-4">
          {/* Video preview */}
          <div className="aspect-video bg-black rounded-neu overflow-hidden relative">
            <video
              controls
              className="w-full h-full"
              poster={data.thumbnailUrl}
            >
              <source src={data.hlsUrl} type="application/x-mpegURL" />
              Your browser does not support HLS video playback.
            </video>
          </div>

          {/* Video info */}
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>HLS Stream</span>
            {data.videoDuration && data.videoDuration > 0 && (
              <span>
                Duration: {Math.floor(data.videoDuration / 60)}:{(data.videoDuration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Thumbnail preview */}
          {data.thumbnailUrl && (
            <div className="flex items-center gap-4">
              <img
                src={data.thumbnailUrl}
                alt="Thumbnail"
                className="w-32 h-18 rounded object-cover"
              />
              <span className="text-sm text-text-muted">Auto-generated thumbnail</span>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              onChange('hlsUrl', '')
              onChange('videoDuration', 0)
              onChange('thumbnailUrl', '')
              onChange('videoStatus', '')
            }}
          >
            Remove Video
          </Button>
        </div>
      ) : (
        <VideoUploader
          webinarId={webinarId}
          webinarTitle={data.title}
          onUploadComplete={handleUploadComplete}
          onError={(err) => console.error('Upload error:', err)}
        />
      )}

      <div className="mt-6 pt-6 border-t border-neu-dark">
        <h4 className="font-medium text-text-primary mb-4">Manual Video URL Entry</h4>
        <p className="text-sm text-text-muted mb-4">
          If you've already processed a video, you can enter the HLS URL directly.
        </p>

        <div className="space-y-4">
          <Input
            label="HLS URL (playlist.m3u8)"
            value={data.hlsUrl || ''}
            onChange={(e) => onChange('hlsUrl', e.target.value)}
            placeholder="e.g., https://vz-xxx.b-cdn.net/{videoId}/playlist.m3u8"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thumbnail URL"
              value={data.thumbnailUrl || ''}
              onChange={(e) => onChange('thumbnailUrl', e.target.value)}
              placeholder="e.g., https://vz-xxx.b-cdn.net/{videoId}/thumbnail.jpg"
            />

            <Input
              label="Duration (seconds)"
              type="number"
              value={data.videoDuration || ''}
              onChange={(e) => onChange('videoDuration', parseInt(e.target.value) || 0)}
              placeholder="e.g., 3600"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
