'use client'

import { ReactNode } from 'react'
import { IconBadge, type IconName } from '@/components/ui'
import { Card } from '@/components/ui/Card'

interface AuthFormCardProps {
  /** Icon to display at the top */
  icon: IconName
  /** Main title */
  title: string
  /** Subtitle text */
  subtitle?: string
  /** Error message to display */
  error?: string
  /** Success message to display */
  success?: string
  /** Form content */
  children: ReactNode
  /** Footer content (e.g., "Already have an account?" link) */
  footer?: ReactNode
  /** Additional className for the card */
  className?: string
}

/**
 * Shared card component for auth forms (login, register, forgot password, reset password)
 * Provides consistent styling and layout for authentication pages
 */
export function AuthFormCard({
  icon,
  title,
  subtitle,
  error,
  success,
  children,
  footer,
  className = '',
}: AuthFormCardProps) {
  return (
    <Card className={`w-full max-w-md ${className}`} padding="lg" darkBg>
      {/* Header with icon and title */}
      <div className="text-center mb-8">
        <div className="inline-flex mb-4">
          <IconBadge icon={icon} size="lg" variant="primary" />
        </div>
        <h2 className="no-margin">{title}</h2>
        {subtitle && (
          <p className="text-secondary mt-2 no-margin">{subtitle}</p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-primary-100 rounded-neu shadow-neu-inset-sm text-primary-700 text-body-sm">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 rounded-neu shadow-neu-inset-sm text-green-700 text-body-sm">
          {success}
        </div>
      )}

      {/* Form content */}
      {children}

      {/* Footer (optional) */}
      {footer && (
        <div className="mt-8 text-center text-body-sm text-secondary">
          {footer}
        </div>
      )}
    </Card>
  )
}

interface AuthFormCardLoadingProps {
  /** Loading text */
  loadingText?: string
}

/**
 * Loading state for AuthFormCard (used in Suspense boundaries)
 */
export function AuthFormCardLoading({ loadingText = 'Loading...' }: AuthFormCardLoadingProps) {
  return (
    <Card className="w-full max-w-md text-center" padding="lg" darkBg>
      <div className="flex justify-center mb-4">
        <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
      </div>
      <h3 className="no-margin">{loadingText}</h3>
    </Card>
  )
}
