/**
 * Typography Components
 *
 * Standardized typography components that use design system tokens.
 * NEVER use inline font sizes, weights, or colors - always use these components.
 *
 * Usage:
 *   <Heading level={1}>Page Title</Heading>
 *   <Heading level={2}>Section Title</Heading>
 *   <Text>Body text paragraph</Text>
 *   <Text size="sm" muted>Small muted text</Text>
 */

import { typographyClasses } from '@/styles/theme'

// =============================================================================
// HEADING COMPONENT
// =============================================================================

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type HeadingVariant = 'default' | 'display'
type DisplaySize = 'lg' | 'xl' | '2xl'

interface HeadingProps {
  level: HeadingLevel
  children: React.ReactNode
  className?: string
  /** Use display variant for hero/landing page headings */
  variant?: HeadingVariant
  /** Display size (only for variant="display") */
  displaySize?: DisplaySize
  /** Remove default margin-bottom */
  noMargin?: boolean
  /** Text color - defaults to text-primary */
  color?: 'primary' | 'secondary' | 'muted' | 'inverse'
}

const headingTags = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const

const colorClasses = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  inverse: 'text-white',
}

export function Heading({
  level,
  children,
  className = '',
  variant = 'default',
  displaySize = 'lg',
  noMargin = false,
  color = 'primary',
}: HeadingProps) {
  const Tag = headingTags[level]

  let baseClasses: string

  if (variant === 'display') {
    baseClasses = typographyClasses.display[displaySize]
  } else {
    const headingKey = `h${level}` as keyof typeof typographyClasses.heading
    baseClasses = typographyClasses.heading[headingKey]
  }

  // Remove margin if noMargin is true
  if (noMargin) {
    baseClasses = baseClasses.replace(/mb-\d+/g, '').trim()
  }

  const classes = `${baseClasses} ${colorClasses[color]} ${className}`.trim()

  return <Tag className={classes}>{children}</Tag>
}

// =============================================================================
// TEXT COMPONENT
// =============================================================================

type TextSize = 'xs' | 'sm' | 'base' | 'lg'
type TextAs = 'p' | 'span' | 'div' | 'label'

interface TextProps {
  children: React.ReactNode
  className?: string
  /** Text size preset */
  size?: TextSize
  /** Render as different HTML element */
  as?: TextAs
  /** Use muted color */
  muted?: boolean
  /** Use secondary color */
  secondary?: boolean
  /** Use label styling (medium weight) */
  label?: boolean
  /** Text color override */
  color?: 'primary' | 'secondary' | 'muted' | 'inverse'
  /** For label elements */
  htmlFor?: string
}

export function Text({
  children,
  className = '',
  size = 'base',
  as = 'p',
  muted = false,
  secondary = false,
  label = false,
  color,
  htmlFor,
}: TextProps) {
  const Tag = as

  // Determine which typography class to use
  let baseClasses: string
  if (label) {
    const labelSize = size === 'lg' ? 'lg' : size === 'xs' ? 'sm' : 'base'
    baseClasses = typographyClasses.label[labelSize as keyof typeof typographyClasses.label]
  } else {
    baseClasses = typographyClasses.body[size]
  }

  // Determine color
  let colorClass: string
  if (color) {
    colorClass = colorClasses[color]
  } else if (muted) {
    colorClass = colorClasses.muted
  } else if (secondary) {
    colorClass = colorClasses.secondary
  } else {
    colorClass = colorClasses.primary
  }

  const classes = `${baseClasses} ${colorClass} ${className}`.trim()

  if (as === 'label') {
    return (
      <label className={classes} htmlFor={htmlFor}>
        {children}
      </label>
    )
  }

  return <Tag className={classes}>{children}</Tag>
}

// =============================================================================
// DISPLAY TEXT (for hero sections)
// =============================================================================

interface DisplayProps {
  children: React.ReactNode
  className?: string
  size?: DisplaySize
  color?: 'primary' | 'secondary' | 'muted' | 'inverse'
}

export function Display({
  children,
  className = '',
  size = 'xl',
  color = 'primary',
}: DisplayProps) {
  const baseClasses = typographyClasses.display[size]
  const classes = `${baseClasses} ${colorClasses[color]} ${className}`.trim()

  return <h1 className={classes}>{children}</h1>
}

// =============================================================================
// LABEL COMPONENT (for form fields)
// =============================================================================

interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  className?: string
  size?: 'sm' | 'base' | 'lg'
  required?: boolean
}

export function Label({
  children,
  htmlFor,
  className = '',
  size = 'base',
  required = false,
}: LabelProps) {
  const baseClasses = typographyClasses.label[size]
  const classes = `${baseClasses} text-text-primary block ${className}`.trim()

  return (
    <label className={classes} htmlFor={htmlFor}>
      {children}
      {required && <span className="text-primary-500 ml-1">*</span>}
    </label>
  )
}

// =============================================================================
// CAPTION COMPONENT (for small helper text)
// =============================================================================

interface CaptionProps {
  children: React.ReactNode
  className?: string
  error?: boolean
}

export function Caption({ children, className = '', error = false }: CaptionProps) {
  const baseClasses = typographyClasses.body.xs
  const colorClass = error ? 'text-primary-600' : 'text-text-muted'
  const classes = `${baseClasses} ${colorClass} ${className}`.trim()

  return <p className={classes}>{children}</p>
}
