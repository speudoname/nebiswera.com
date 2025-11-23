'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { Loader2, LucideIcon } from 'lucide-react'

/**
 * Button Component - Design System Rules
 *
 * LAYOUT RULES:
 * 1. Content ALWAYS stays on single line (whitespace-nowrap)
 * 2. Icons are added via leftIcon/rightIcon props with standardized gap
 * 3. Button width adapts to content, or use fullWidth prop
 * 4. NO inline className for layout/spacing adjustments
 *
 * USAGE:
 *   <Button>Click me</Button>
 *   <Button rightIcon={ArrowRight}>Next</Button>
 *   <Button leftIcon={BookOpen}>Learn More</Button>
 *   <Button leftIcon={Search} iconOnly aria-label="Search" />
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Icon component to show on the left */
  leftIcon?: LucideIcon
  /** Icon component to show on the right */
  rightIcon?: LucideIcon
  /** Icon-only button (square aspect ratio) */
  iconOnly?: boolean
  /** Full width button */
  fullWidth?: boolean
  /** Loading state */
  loading?: boolean
  /** Text to show during loading */
  loadingText?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      iconOnly = false,
      fullWidth = false,
      loading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles - ALWAYS inline-flex, single line
    const baseStyles = `
      inline-flex items-center justify-center
      whitespace-nowrap
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
      danger: `
        bg-primary-700 text-white
        shadow-neu hover:shadow-neu-hover
        hover:bg-primary-800
        active:shadow-neu-pressed active:bg-primary-900
      `,
    }

    // Sizes - include icon sizing
    const sizes = {
      sm: {
        padding: iconOnly ? 'p-2' : 'px-4 py-2',
        text: 'text-sm',
        gap: 'gap-1.5',
        iconSize: 'h-4 w-4',
      },
      md: {
        padding: iconOnly ? 'p-2.5' : 'px-6 py-2.5',
        text: 'text-sm',
        gap: 'gap-2',
        iconSize: 'h-4 w-4',
      },
      lg: {
        padding: iconOnly ? 'p-3' : 'px-8 py-3',
        text: 'text-base',
        gap: 'gap-2.5',
        iconSize: 'h-5 w-5',
      },
    }

    const sizeConfig = sizes[size]
    const widthClass = fullWidth ? 'w-full' : ''

    // Build class string
    const buttonClasses = `
      ${baseStyles}
      ${variants[variant]}
      ${sizeConfig.padding}
      ${sizeConfig.text}
      ${sizeConfig.gap}
      ${widthClass}
      ${className}
    `.trim()

    // Loading state
    if (loading) {
      return (
        <button
          ref={ref}
          className={buttonClasses}
          disabled={true}
          {...props}
        >
          <Loader2 className={`${sizeConfig.iconSize} animate-spin`} />
          {loadingText && <span>{loadingText}</span>}
        </button>
      )
    }

    // Icon-only button
    if (iconOnly && LeftIcon) {
      return (
        <button
          ref={ref}
          className={buttonClasses}
          disabled={disabled}
          {...props}
        >
          <LeftIcon className={sizeConfig.iconSize} />
        </button>
      )
    }

    // Standard button with optional icons
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled}
        {...props}
      >
        {LeftIcon && <LeftIcon className={sizeConfig.iconSize} />}
        {children}
        {RightIcon && <RightIcon className={sizeConfig.iconSize} />}
      </button>
    )
  }
)

Button.displayName = 'Button'
