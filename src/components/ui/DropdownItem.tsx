'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

/**
 * DropdownItem Component - Standardized dropdown menu item
 *
 * Used in dropdown menus throughout the app for consistent styling.
 * Supports both links and buttons.
 *
 * USAGE:
 *   <DropdownItem href="/dashboard" icon={LayoutDashboard}>Dashboard</DropdownItem>
 *   <DropdownItem onClick={handleLogout} icon={LogOut} variant="danger">Logout</DropdownItem>
 *   <DropdownItem as="button" onClick={handleAction} icon={Settings}>Settings</DropdownItem>
 */

interface DropdownItemProps {
  /** Lucide icon component */
  icon?: LucideIcon
  /** Content of the item */
  children: ReactNode
  /** Color variant */
  variant?: 'default' | 'danger'
  /** Additional class names */
  className?: string
  /** URL for link items */
  href?: string
  /** Click handler */
  onClick?: () => void
  /** Render as button */
  as?: 'button'
  /** Button type */
  type?: 'button' | 'submit'
}

const variantClasses = {
  default: 'text-text-secondary hover:text-text-primary hover:bg-neu-dark/30',
  danger: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50',
}

export function DropdownItem({
  icon: Icon,
  children,
  variant = 'default',
  className = '',
  href,
  onClick,
  as,
  type,
}: DropdownItemProps) {
  const baseClasses = `
    flex items-center gap-3 w-full px-4 py-2.5
    text-sm transition-colors
    ${variantClasses[variant]}
    ${className}
  `.trim()

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </>
  )

  // Render as link if href is provided and not explicitly set as button
  if (href && as !== 'button') {
    return (
      <Link href={href} onClick={onClick} className={baseClasses}>
        {content}
      </Link>
    )
  }

  // Render as button
  return (
    <button type={type || 'button'} onClick={onClick} className={baseClasses}>
      {content}
    </button>
  )
}
