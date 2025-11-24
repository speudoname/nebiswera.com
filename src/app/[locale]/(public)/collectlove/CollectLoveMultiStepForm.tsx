'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { StepIndicator } from './components/StepIndicator'
import { Step1BasicInfo } from './steps/Step1BasicInfo'
import { Step2ProfilePhoto } from './steps/Step2ProfilePhoto'
import { Step3AudioVideo } from './steps/Step3AudioVideo'
import { Step5ThankYou } from './steps/Step5ThankYou'

export function CollectLoveMultiStepForm() {
  const locale = useLocale()
  const [currentStep, setCurrentStep] = useState(1)
  const [testimonialId, setTestimonialId] = useState<string | null>(null)

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
