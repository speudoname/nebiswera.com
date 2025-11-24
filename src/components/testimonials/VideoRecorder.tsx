'use client'

import { useState, useRef } from 'react'
import { Video, Square, Play, Pause, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onUploadVideo: (file: File) => void
  locale: string
}

export function VideoRecorder({ onRecordingComplete, onUploadVideo, locale }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoURL, setVideoURL] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const t = {
    ka: {
      record: 'ჩაწერა',
      stop: 'შეწყვეტა',
      play: 'დაკვრა',
      pause: 'პაუზა',
      delete: 'წაშლა',
      upload: 'ატვირთვა',
      recording: 'იწერება...',
      selectFile: 'აირჩიე ვიდეო',
    },
    en: {
      record: 'Record',
      stop: 'Stop',
      play: 'Play',
      pause: 'Pause',
      delete: 'Delete',
      upload: 'Upload',
      recording: 'Recording...',
      selectFile: 'Select Video',
    },
  }[locale as 'ka' | 'en']

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      streamRef.current = stream

      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.play()
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoURL(URL.createObjectURL(blob))
        onRecordingComplete(blob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        setShowPreview(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setShowPreview(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert(locale === 'ka' ? 'კამერაზე წვდომა შეზღუდულია' : 'Camera access denied')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function playVideo() {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  function pauseVideo() {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  function deleteRecording() {
    setVideoBlob(null)
    setVideoURL('')
    setIsPlaying(false)
    setShowPreview(false)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onUploadVideo(file)
      setVideoURL(URL.createObjectURL(file))
      setVideoBlob(file)
    }
  }

  return (
    <div className="space-y-4">
      {!videoBlob && !isRecording && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={Video}
            onClick={startRecording}
          >
            {t.record}
          </Button>
          <label>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <span
              className="inline-flex items-center justify-center whitespace-nowrap font-medium rounded-neu transition-all duration-200 px-6 py-3 text-sm gap-2 bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover hover:bg-neu-light active:shadow-neu-pressed cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              {t.upload}
            </span>
          </label>
        </div>
      )}

      {showPreview && isRecording && (
        <div className="space-y-2">
          <video
            ref={previewRef}
            className="w-full max-w-md rounded-neu shadow-neu"
            autoPlay
            muted
            playsInline
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-text-secondary">{t.recording}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              leftIcon={Square}
              onClick={stopRecording}
            >
              {t.stop}
            </Button>
          </div>
        </div>
      )}

      {videoBlob && videoURL && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            src={videoURL}
            controls
            onEnded={() => setIsPlaying(false)}
            className="w-full max-w-md rounded-neu shadow-neu"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={Trash2}
              onClick={deleteRecording}
            >
              {t.delete}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
