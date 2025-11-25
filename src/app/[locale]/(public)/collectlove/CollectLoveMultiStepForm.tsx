'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { StepIndicator } from './components/StepIndicator'
import { Step1BasicInfo } from './steps/Step1BasicInfo'
import { Step2ProfilePhoto } from './steps/Step2ProfilePhoto'
import { Step3AudioVideo } from './steps/Step3AudioVideo'
import { Step5ThankYou } from './steps/Step5ThankYou'

const STORAGE_KEY = 'testimonial_progress'

export function CollectLoveMultiStepForm() {
  const locale = useLocale()
  const [currentStep, setCurrentStep] = useState(1)
  const [testimonialId, setTestimonialId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { step, id } = JSON.parse(saved)
        if (step && id) {
          setCurrentStep(step)
          setTestimonialId(id)
        }
      } catch (e) {
        // Invalid data, ignore
      }
    }
    setIsLoaded(true)
  }, [])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && testimonialId && currentStep < 4) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step: currentStep,
        id: testimonialId,
      }))
    }
  }, [currentStep, testimonialId, isLoaded])

  // Clear progress when reaching thank you page
  useEffect(() => {
    if (currentStep === 4) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [currentStep])

  // Don't render until we've checked localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neu-base py-12 px-4 flex items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    )
  }

  function handleStep1Complete(data: {
    name: string
    email: string
    text: string
    rating: number
    testimonialId: string
  }) {
    setTestimonialId(data.testimonialId)
    setCurrentStep(2)
  }

  function handleStep2Complete() {
    setCurrentStep(3)
  }

  function handleStep2Skip() {
    setCurrentStep(3)
  }

  function handleStep3Complete() {
    setCurrentStep(4)
  }

  function handleStep3Skip() {
    setCurrentStep(4)
  }

  return (
    <div className="min-h-screen bg-neu-base py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {currentStep < 4 && (
          <StepIndicator currentStep={currentStep} totalSteps={4} />
        )}

        <div className="animate-fade-in">
          {currentStep === 1 && (
            <Step1BasicInfo onComplete={handleStep1Complete} />
          )}

          {currentStep === 2 && testimonialId && (
            <Step2ProfilePhoto
              testimonialId={testimonialId}
              onComplete={handleStep2Complete}
              onSkip={handleStep2Skip}
            />
          )}

          {currentStep === 3 && testimonialId && (
            <Step3AudioVideo
              testimonialId={testimonialId}
              onComplete={handleStep3Complete}
              onSkip={handleStep3Skip}
            />
          )}

          {currentStep === 4 && (
            <Step5ThankYou locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}
