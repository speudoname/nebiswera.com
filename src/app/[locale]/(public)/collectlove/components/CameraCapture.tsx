'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Camera, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const t = useTranslations('collectLove.step2.camera')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Camera access denied')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function startCountdown() {
    setCountdown(3)
  }

  useEffect(() => {
    if (countdown === null) return

    if (countdown === 0) {
      capturePhoto()
      setCountdown(null)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Flash effect
    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)
        setCapturedBlob(blob)
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }

  function handleRetake() {
    setCapturedImage(null)
    setCapturedBlob(null)
    startCamera()
  }

  function handleUsePhoto() {
    if (capturedBlob) {
      onCapture(capturedBlob)
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={onCancel}>{t('cancel')}</Button>
      </div>
    )
  }

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video bg-black rounded-neu-lg overflow-hidden shadow-neu-md">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleRetake}
            className="flex-1"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            {t('retake')}
          </Button>
          <Button
            variant="primary"
            onClick={handleUsePhoto}
            className="flex-1"
          >
            <Check className="w-5 h-5 mr-2" />
            {t('usePhoto')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-neu-lg overflow-hidden shadow-neu-md">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-9xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {flash && (
          <div className="absolute inset-0 bg-white animate-flash" />
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          {t('cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={startCountdown}
          disabled={!isReady || countdown !== null}
          className="flex-1"
        >
          <Camera className="w-5 h-5 mr-2" />
          {t('takePhoto')}
        </Button>
      </div>
    </div>
  )
}
