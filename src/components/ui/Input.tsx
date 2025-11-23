'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-3
            bg-neu-base rounded-neu
            shadow-neu-inset
            border-2 border-transparent
            text-text-primary placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:border-primary-400 focus:shadow-neu-inset-md
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-primary-500 focus:border-primary-500' : ''}
            ${className}
          `}
          {...props}
        />
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

Input.displayName = 'Input'
