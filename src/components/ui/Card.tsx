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

// Light background shadows (default)
const variantClasses = {
  raised: 'shadow-neu',
  flat: 'shadow-neu-flat',
  inset: 'shadow-neu-inset',
}

// Dark/colored background shadows
const variantClassesDark = {
  raised: 'shadow-neu-dark',
  flat: 'shadow-neu-flat',
  inset: 'shadow-neu-dark-inset',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'raised', padding = 'md', darkBg = false, children, ...props }, ref) => {
    const shadowClasses = darkBg ? variantClassesDark : variantClasses
    return (
      <div
        ref={ref}
        className={`bg-neu-base rounded-neu-md ${shadowClasses[variant]} ${paddingClasses[padding]} ${className}`}
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
