'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check your permissions.')
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

  function playAudio() {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  function pauseAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  function retake() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  function handleUseRecording() {
    if (audioBlob) {
      onRecordingComplete(audioBlob)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 bg-neu-base rounded-neu-lg shadow-neu-md">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-neu-lg">
          <Mic className="w-12 h-12 text-white" />
        </div>
        <p className="text-2xl font-bold text-text-primary">
          {formatTime(recordingTime)}
        </p>
        {isRecording && (
          <p className="text-sm text-text-secondary mt-1">
            {isPaused ? 'Paused' : 'Recording...'}
          </p>
        )}
      </div>

      {!audioUrl ? (
        <div className="space-y-3">
          {!isRecording ? (
            <Button variant="primary" size="lg" fullWidth onClick={startRecording}>
              <Mic className="w-5 h-5 mr-2" />
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
                Stop
              </Button>
            </div>
          )}
          <Button variant="ghost" size="lg" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            {!isPlaying ? (
              <Button variant="secondary" fullWidth onClick={playAudio}>
                <Play className="w-5 h-5 mr-2" />
                Play
              </Button>
            ) : (
              <Button variant="secondary" fullWidth onClick={pauseAudio}>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
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
