'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, loadingText, children, disabled, ...props }, ref) => {
    const baseStyles = `
      font-medium rounded-neu transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neu-base
      disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
    `

    const variants = {
      primary: `
        bg-primary-500 text-white
        shadow-neu hover:shadow-neu-hover
        hover:bg-primary-600
        active:shadow-neu-pressed active:bg-primary-700
      `,
      secondary: `
        bg-neu-base text-text-primary
        shadow-neu hover:shadow-neu-hover
        hover:bg-neu-light
        active:shadow-neu-pressed
      `,
      ghost: `
        bg-transparent text-text-primary
        hover:bg-neu-dark/50
        active:bg-neu-dark
      `,
      outline: `
        bg-neu-base text-primary-600
        border-2 border-primary-300
        shadow-neu-sm hover:shadow-neu
        hover:border-primary-400 hover:bg-primary-50
        active:shadow-neu-inset-sm
      `,
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
