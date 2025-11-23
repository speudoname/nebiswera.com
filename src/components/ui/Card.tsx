'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'flat' | 'inset'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Use dark background shadow variants (for cards on gradients/dark surfaces) */
  darkBg?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

// Shadow class helper - uses direct strings for Tailwind detection
function getShadowClass(variant: 'raised' | 'flat' | 'inset', darkBg: boolean): string {
  if (darkBg) {
    // Dark/colored background shadows
    if (variant === 'raised') return 'shadow-neu-dark'
    if (variant === 'flat') return 'shadow-neu-flat'
    if (variant === 'inset') return 'shadow-neu-dark-inset'
  }
  // Light background shadows (default)
  if (variant === 'raised') return 'shadow-neu'
  if (variant === 'flat') return 'shadow-neu-flat'
  if (variant === 'inset') return 'shadow-neu-inset'
  return 'shadow-neu'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'raised', padding = 'md', darkBg = false, children, ...props }, ref) => {
    const shadowClass = getShadowClass(variant, darkBg)
    return (
      <div
        ref={ref}
        className={`bg-neu-base rounded-neu-md ${shadowClass} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card Header component
interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-primary-100 rounded-neu text-primary-600">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card Content component
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer component
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-6 pt-4 border-t border-neu-dark/30 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'
