interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'md'
}

// Using our 5-color palette for semantic meanings:
// - success: secondary (orchid)
// - warning: primary (coral)
// - error: primary dark (coral dark)
// - info: accent (deep purple)
// - default: neutral (from neu palette)
const variantClasses = {
  success: 'bg-secondary-100 text-secondary-800',
  warning: 'bg-primary-100 text-primary-800',
  error: 'bg-primary-200 text-primary-900',
  info: 'bg-accent-100 text-accent-800',
  default: 'bg-neu-dark text-text-primary',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  )
}
