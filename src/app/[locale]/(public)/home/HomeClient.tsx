'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ArrowRight, BookOpen, Volume2, VolumeX } from 'lucide-react'

export function HomeClient() {
  const t = useTranslations('home')
  const locale = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [showButton, setShowButton] = useState(true)
  const [hasUnmuted, setHasUnmuted] = useState(false)

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)

      // If unmuting for the first time, hide the button
      if (!videoRef.current.muted && !hasUnmuted) {
        setHasUnmuted(true)
        setShowButton(false)
      }
    }
  }

  function handleVideoClick() {
    // After first unmute, clicking video toggles button visibility
    if (hasUnmuted) {
      setShowButton(!showButton)
    }
  }

  return (
    <section className="pt-4 pb-16 md:pt-8 md:pb-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-3xl">
        <p className="eyebrow mb-4 md:mb-4">
          <span className="text-primary-600">{t('eyebrowStart')}</span>
          <span className="text-text-secondary"> {t('eyebrowEmphasis')} </span>
          <span className="text-primary-600">{t('eyebrowEnd')}</span>
        </p>
        <h1 className="hero-title mb-4 md:mb-6">
          <span className="text-text-primary">{t('titlePart1')}</span>
          <span className="text-primary-600"> — </span>
          <span className="text-primary-600">{t('titlePart2')}</span>
        </h1>
        <h2 className="hero-subtitle mb-6 md:mb-8">
          {t('subtitle')}
        </h2>

        {/* Video */}
        <div className="mb-6 md:mb-8 w-full max-w-xl mx-auto rounded-neu shadow-neu overflow-hidden aspect-video relative">
          <video
            ref={videoRef}
            onClick={handleVideoClick}
            className="w-full h-full object-cover cursor-pointer"
            width={1280}
            height={720}
            autoPlay
            muted
            loop
            playsInline
            // @ts-expect-error - fetchPriority is valid but not in React types yet
            fetchPriority="high"
            poster="https://cdn.nebiswera.com/hero-video-poster.jpg"
          >
            <source src="https://cdn.nebiswera.com/hero-video.mp4" type="video/mp4" />
          </video>

          {/* Unmute Button */}
          {showButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleMute()
              }}
              className={`absolute transition-all ${
                !hasUnmuted
                  ? 'top-6 right-6 bg-primary-500 text-white px-6 py-4 rounded-neu shadow-neu-md hover:shadow-neu-lg hover:bg-primary-600 active:shadow-neu-pressed'
                  : 'top-4 right-4 bg-neu-base/90 backdrop-blur-sm text-text-primary rounded-full p-3 shadow-neu hover:shadow-neu-hover active:shadow-neu-pressed'
              }`}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {!hasUnmuted ? (
                <div className="flex items-center gap-2">
                  <VolumeX className="w-6 h-6" />
                  <span className="font-semibold text-sm">
                    {locale === 'ka' ? 'ხმის ჩართვა' : 'Click for Sound'}
                  </span>
                </div>
              ) : isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href={`/${locale}/auth/register`} className="w-full sm:w-auto">
            <Button size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto">
              {t('getStarted')}
            </Button>
          </Link>
          <a href="#learn-more" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" leftIcon={BookOpen} className="w-full sm:w-auto">
              {t('learnMore')}
            </Button>
          </a>
        </div>
      </div>
    </div>
    </section>
  )
}
