'use client'

import { useState, useRef, useEffect } from 'react'
import { Video, Square, Play, Pause, Trash2, Check, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

export function VideoRecorder({ onRecordingComplete, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraStarted, setCameraStarted] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const playbackRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoUrl])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current = stream

      if (previewRef.current) {
        previewRef.current.srcObject = stream
        await previewRef.current.play()
        setCameraStarted(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check your permissions.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setCameraStarted(false)
    }
  }

  async function startRecording() {
    if (!streamRef.current) {
      await startCamera()
      // Wait a bit for camera to initialize
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (!streamRef.current) return

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
      })
      mediaRecorderRef.current = mediaRecorder
      videoChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        stopCamera()
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not start recording. Please try again.')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
  }

  function retake() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoBlob(null)
    setVideoUrl(null)
    setRecordingTime(0)
    startCamera()
  }

  function handleUseRecording() {
    if (videoBlob) {
      onRecordingComplete(videoBlob)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <div className="p-6 bg-neu-base rounded-neu-lg shadow-neu-md">
      <div className="mb-6 relative bg-black rounded-neu overflow-hidden aspect-video max-h-[60vh]">
        {!videoUrl ? (
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={playbackRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {formatTime(recordingTime)}
          </div>
        )}

        {isPaused && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Paused
          </div>
        )}
      </div>

      {!videoUrl ? (
        <div className="space-y-3">
          {!isRecording ? (
            <Button variant="primary" size="lg" fullWidth onClick={startRecording}>
              <Camera className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <div className="flex gap-3">
              {!isPaused ? (
                <Button variant="secondary" fullWidth onClick={pauseRecording}>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button variant="secondary" fullWidth onClick={resumeRecording}>
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              <Button variant="primary" fullWidth onClick={stopRecording}>
                <Square className="w-5 h-5 mr-2" />
                Finish Recording
              </Button>
            </div>
          )}
          <Button variant="ghost" size="lg" fullWidth onClick={() => { stopCamera(); onCancel(); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={retake}>
              <Trash2 className="w-5 h-5 mr-2" />
              Retake
            </Button>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={handleUseRecording}>
            <Check className="w-5 h-5 mr-2" />
            Use This Recording
          </Button>
        </div>
      )}
    </div>
  )
}
