'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { StepIndicator } from './components/StepIndicator'
import { Step1BasicInfo } from './steps/Step1BasicInfo'
import { Step2ProfilePhoto } from './steps/Step2ProfilePhoto'
import { Step3AudioVideo } from './steps/Step3AudioVideo'
import { Step4AdditionalImages } from './steps/Step4AdditionalImages'
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

  function handleStep4Complete() {
    setCurrentStep(5)
  }

  function handleStep4Skip() {
    setCurrentStep(5)
  }

  return (
    <div className="min-h-screen bg-neu-base py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {currentStep < 5 && (
          <StepIndicator currentStep={currentStep} totalSteps={5} />
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

          {currentStep === 4 && testimonialId && (
            <Step4AdditionalImages
              testimonialId={testimonialId}
              onComplete={handleStep4Complete}
              onSkip={handleStep4Skip}
            />
          )}

          {currentStep === 5 && (
            <Step5ThankYou locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}
