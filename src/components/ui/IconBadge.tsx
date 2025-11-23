'use client'

import { LucideIcon } from 'lucide-react'

/**
 * IconBadge Component - Standardized icon container
 *
 * Used throughout the app for displaying icons in a consistent neomorphic badge style.
 * Commonly used in:
 * - Auth pages (login, register, verify-email, etc.)
 * - Dashboard stat cards
 * - Profile loading states
 * - Modal headers
 *
 * USAGE:
 *   <IconBadge icon={LogIn} />
 *   <IconBadge icon={CheckCircle} size="lg" variant="secondary" />
 *   <IconBadge icon={AlertTriangle} variant="danger" />
 */

interface IconBadgeProps {
  /** Lucide icon component */
  icon: LucideIcon
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'neutral'
  /** Additional class names for container */
  className?: string
  /** Additional class names for icon (e.g., 'animate-spin') */
  iconClassName?: string
}

const sizeClasses = {
  sm: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
  },
  lg: {
    container: 'w-14 h-14',
    icon: 'w-7 h-7',
  },
}

const variantClasses = {
  primary: {
    container: 'bg-primary-100',
    icon: 'text-primary-600',
  },
  secondary: {
    container: 'bg-secondary-100',
    icon: 'text-secondary-600',
  },
  accent: {
    container: 'bg-accent-100',
    icon: 'text-accent-700',
  },
  danger: {
    container: 'bg-primary-100',
    icon: 'text-primary-600',
  },
  neutral: {
    container: 'bg-neu-dark',
    icon: 'text-text-primary',
  },
}

export function IconBadge({
  icon: Icon,
  size = 'md',
  variant = 'primary',
  className = '',
  iconClassName = '',
}: IconBadgeProps) {
  const sizeConfig = sizeClasses[size]
  const variantConfig = variantClasses[variant]

  return (
    <div
      className={`
        ${sizeConfig.container}
        ${variantConfig.container}
        rounded-neu shadow-neu-sm
        flex items-center justify-center
        ${className}
      `.trim()}
    >
      <Icon className={`${sizeConfig.icon} ${variantConfig.icon} ${iconClassName}`.trim()} />
    </div>
  )
}
