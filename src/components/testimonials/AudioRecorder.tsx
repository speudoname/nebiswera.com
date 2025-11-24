'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onUploadAudio: (file: File) => void
  locale: string
}

export function AudioRecorder({ onRecordingComplete, onUploadAudio, locale }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioURL, setAudioURL] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const t = {
    ka: {
      record: 'ჩაწერა',
      stop: 'შეწყვეტა',
      play: 'დაკვრა',
      pause: 'პაუზა',
      delete: 'წაშლა',
      upload: 'ატვირთვა',
      recording: 'იწერება...',
      selectFile: 'აირჩიე ფაილი',
    },
    en: {
      record: 'Record',
      stop: 'Stop',
      play: 'Play',
      pause: 'Pause',
      delete: 'Delete',
      upload: 'Upload',
      recording: 'Recording...',
      selectFile: 'Select File',
    },
  }[locale as 'ka' | 'en']

  async function startRecording() {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(locale === 'ka'
          ? 'თქვენი ბრაუზერი არ უჭერს მხარს აუდიო ჩაწერას'
          : 'Your browser does not support audio recording')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Check which mime types are supported
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
        onRecordingComplete(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error: any) {
      console.error('Error accessing microphone:', error)

      let message = locale === 'ka'
        ? 'მიკროფონზე წვდომა შეზღუდულია. გთხოვთ მიეცით ნებართვა ბრაუზერის პარამეტრებში.'
        : 'Microphone access denied. Please allow microphone permission in your browser settings.'

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = locale === 'ka'
          ? 'მიკროფონზე წვდომა უარყოფილია. გთხოვთ მიეცით ნებართვა.'
          : 'Microphone permission was denied. Please grant permission and try again.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message = locale === 'ka'
          ? 'მიკროფონი არ მოიძებნა.'
          : 'No microphone found on your device.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        message = locale === 'ka'
          ? 'მიკროფონი უკვე გამოიყენება სხვა აპლიკაციის მიერ.'
          : 'Microphone is already in use by another application.'
      }

      alert(message)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function playAudio() {
    if (audioRef.current) {
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

  function deleteRecording() {
    setAudioBlob(null)
    setAudioURL('')
    setIsPlaying(false)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onUploadAudio(file)
      setAudioURL(URL.createObjectURL(file))
      setAudioBlob(file)
    }
  }

  return (
    <div className="space-y-4">
      {!audioBlob && !isRecording && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={Mic}
            onClick={startRecording}
          >
            {t.record}
          </Button>
          <label>
            <input
              type="file"
              accept="audio/*"
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

      {isRecording && (
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
      )}

      {audioBlob && audioURL && (
        <div className="space-y-2">
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={isPlaying ? Pause : Play}
              onClick={isPlaying ? pauseAudio : playAudio}
            >
              {isPlaying ? t.pause : t.play}
            </Button>
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
