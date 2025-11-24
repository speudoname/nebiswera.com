'use client'

import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full transition-all
              ${
                step < currentStep
                  ? 'bg-primary-500 text-white shadow-neu-sm'
                  : step === currentStep
                  ? 'bg-primary-500 text-white shadow-neu-md scale-110'
                  : 'bg-neu-light text-text-secondary shadow-neu-inset-sm'
              }
            `}
          >
            {step < currentStep ? (
              <Check className="w-5 h-5" />
            ) : (
              <span className="font-semibold">{step}</span>
            )}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`
                w-8 h-1 mx-1 rounded-full transition-all
                ${
                  step < currentStep
                    ? 'bg-primary-500'
                    : 'bg-neu-dark'
                }
              `}
            />
          )}
        </div>
      ))}
    </div>
  )
}
