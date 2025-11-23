'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, hint, id, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={`
              w-full px-4 py-3 pr-10
              appearance-none
              bg-neu-base rounded-neu
              shadow-neu-inset
              border-2 border-transparent
              text-text-primary
              transition-all duration-200
              focus:outline-none focus:border-primary-400 focus:shadow-neu-inset-md
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neu-dark/30
              ${error ? 'border-primary-500 focus:border-primary-500' : ''}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-primary-600 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
