/**
 * Nebiswera Design System - Single Source of Truth
 *
 * ALL design tokens are defined here. NO inline styles allowed.
 * To change any visual aspect of the app, modify this file.
 *
 * Color Palette (5 colors + black/white):
 * - Light Pink (#FFCCE5) - Background/Surface
 * - Orchid (#CC7EB8) - Secondary/Success
 * - Deep Purple (#6B2D5C) - Accent/Info
 * - Coral (#F27059) - Primary/Warning/Error
 * - Dark Purple (#4A3060) - Text Primary
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Primary - Coral/Orange (#F27059) - CTAs, buttons, links, warnings, errors
  primary: {
    50: '#FEF3F1',
    100: '#FDE7E3',
    200: '#FBCFC7',
    300: '#F7A99B',
    400: '#F58A78',
    500: '#F27059', // Main primary
    600: '#E04D36',
    700: '#BC3A26',
    800: '#9B3324',
    900: '#812F24',
  },
  // Secondary - Orchid/Magenta (#CC7EB8) - Secondary actions, success states
  secondary: {
    50: '#FCF5FA',
    100: '#F9EBF5',
    200: '#F3D7EB',
    300: '#E9B8DA',
    400: '#DB94C5',
    500: '#CC7EB8', // Main secondary
    600: '#B35C9A',
    700: '#96497D',
    800: '#7C3E67',
    900: '#683757',
  },
  // Accent - Deep Purple (#6B2D5C) - Info states, highlights
  accent: {
    50: '#F9F3F7',
    100: '#F3E7F0',
    200: '#E7CFE1',
    300: '#D4AAC9',
    400: '#BA7BA8',
    500: '#9E5688',
    600: '#853F71',
    700: '#6B2D5C', // Main accent
    800: '#5A274D',
    900: '#4D2342',
  },
  // Neomorphic surface colors (Light Pink #FFCCE5)
  neu: {
    base: '#FFCCE5',      // Main background
    light: '#FFE0F0',     // Elevated elements
    dark: '#F0B8D6',      // Sunken/border elements
    shadow: '#D9A3C2',    // Shadow color
    highlight: '#FFFFFF', // Highlight color
  },
  // Text colors (Dark Purple #4A3060)
  text: {
    primary: '#4A3060',   // Main text, headings
    secondary: '#6B2D5C', // Secondary text
    muted: '#9E7A92',     // Muted/placeholder text
    inverse: '#FFFFFF',   // White for dark backgrounds
  },
} as const

// Semantic color mapping
export const semanticColors = {
  success: colors.secondary,  // Orchid
  warning: colors.primary,    // Coral
  error: colors.primary,      // Coral (darker shades)
  info: colors.accent,        // Deep Purple
} as const

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const fontFamily = {
  sans: ['var(--font-inter)', 'var(--font-georgian)', 'system-ui', 'sans-serif'],
  georgian: ['var(--font-georgian)', 'system-ui', 'sans-serif'],
} as const

export const fontSize = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem',      // 48px
  '6xl': '3.75rem',   // 60px
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const

// Typography presets - Tailwind class mappings
// Use these class names in Typography components
export const typographyClasses = {
  // Display headings (hero sections, landing pages)
  display: {
    '2xl': 'text-6xl font-bold leading-none tracking-tight',
    xl: 'text-5xl font-bold leading-none tracking-tight',
    lg: 'text-4xl font-bold leading-tight tracking-tight',
  },
  // Standard headings - with margin-bottom for proper spacing
  heading: {
    h1: 'text-3xl font-bold leading-tight tracking-tight mb-4',
    h2: 'text-2xl font-semibold leading-snug tracking-tight mb-2',
    h3: 'text-xl font-semibold leading-snug mb-2',
    h4: 'text-lg font-semibold leading-normal mb-1',
    h5: 'text-base font-semibold leading-normal mb-1',
    h6: 'text-sm font-semibold leading-normal tracking-wide mb-1',
  },
  // Body text
  body: {
    lg: 'text-lg leading-relaxed',
    base: 'text-base leading-relaxed',
    sm: 'text-sm leading-normal',
    xs: 'text-xs leading-normal',
  },
  // Labels and captions
  label: {
    lg: 'text-base font-medium leading-normal',
    base: 'text-sm font-medium leading-normal',
    sm: 'text-xs font-medium leading-normal tracking-wide',
  },
} as const

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  // Named sizes for semantic use
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const

// =============================================================================
// SHADOWS (Neomorphic)
// =============================================================================

export const shadows = {
  // Raised elements (buttons, cards)
  neu: {
    sm: '4px 4px 8px #D9A3C2, -4px -4px 8px #FFFFFF',
    DEFAULT: '6px 6px 12px #D9A3C2, -6px -6px 12px #FFFFFF',
    md: '8px 8px 16px #D9A3C2, -8px -8px 16px #FFFFFF',
    lg: '12px 12px 24px #D9A3C2, -12px -12px 24px #FFFFFF',
  },
  // Pressed/inset elements (inputs, pressed buttons)
  neuInset: {
    sm: 'inset 2px 2px 4px #D9A3C2, inset -2px -2px 4px #FFFFFF',
    DEFAULT: 'inset 4px 4px 8px #D9A3C2, inset -4px -4px 8px #FFFFFF',
    md: 'inset 6px 6px 12px #D9A3C2, inset -6px -6px 12px #FFFFFF',
  },
  // Flat subtle shadow
  flat: '0 2px 8px rgba(74, 48, 96, 0.08)',
  // Hover state
  hover: '8px 8px 16px #D9A3C2, -8px -8px 16px #FFFFFF',
  // Pressed state
  pressed: 'inset 4px 4px 8px #D9A3C2, inset -4px -4px 8px #FFFFFF',
  // Text shadow for light text on colored backgrounds
  text: '2px 2px 8px rgba(74, 48, 96, 0.4)',
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
  // Neomorphic specific
  neu: {
    sm: '8px',
    DEFAULT: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
  },
} as const

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '150ms ease',
  DEFAULT: '200ms ease',
  slow: '300ms ease',
  colors: 'color 200ms ease, background-color 200ms ease, border-color 200ms ease',
  shadow: 'box-shadow 200ms ease',
  transform: 'transform 200ms ease',
  all: 'all 200ms ease',
} as const

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',     // Dropdowns, tooltips
  100: '100',   // Sticky elements
  200: '200',   // Modals
  300: '300',   // Notifications
  999: '999',   // Maximum
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// =============================================================================
// COMPLETE THEME EXPORT
// =============================================================================

export const theme = {
  colors,
  semanticColors,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typographyClasses,
  spacing,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
} as const

// Type exports
export type Theme = typeof theme
export type Colors = typeof colors
export type TypographyClasses = typeof typographyClasses
export type Spacing = typeof spacing
