/**
 * Nebiswera Design System - Theme Configuration
 *
 * Neomorphic design with deep purple/lavender pastel palette.
 * All components should use these tokens for consistency.
 */

export const theme = {
  colors: {
    // Primary purple/lavender palette
    primary: {
      50: '#F5F0FF',
      100: '#EBE0FF',
      200: '#D4C4F9',
      300: '#B8A1E8',
      400: '#9D7FD9',
      500: '#8B5CF6', // Main primary
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    // Secondary - soft lavender
    secondary: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
    },
    // Neomorphic background colors
    background: {
      // Light mode neomorphic base
      base: '#E8E0F0',      // Soft lavender-gray
      elevated: '#F0E8F8',   // Slightly lighter for elevated elements
      sunken: '#DED6E8',     // Slightly darker for pressed/inset states
    },
    // Surface colors for cards and containers
    surface: {
      DEFAULT: '#E8E0F0',
      light: '#F0E8F8',
      dark: '#DED6E8',
    },
    // Text colors
    text: {
      primary: '#2D1B4E',    // Deep purple for main text
      secondary: '#5B4478',  // Medium purple for secondary text
      muted: '#8B7AA0',      // Light purple for muted text
      inverse: '#FFFFFF',    // White for dark backgrounds
    },
    // Accent colors
    accent: {
      success: '#10B981',    // Green
      warning: '#F59E0B',    // Amber
      error: '#EF4444',      // Red
      info: '#3B82F6',       // Blue
    },
  },

  // Neomorphic shadows
  shadows: {
    // Raised elements (buttons, cards)
    neumorph: {
      sm: '4px 4px 8px #C9C1D4, -4px -4px 8px #FFFFFF',
      DEFAULT: '6px 6px 12px #C9C1D4, -6px -6px 12px #FFFFFF',
      md: '8px 8px 16px #C9C1D4, -8px -8px 16px #FFFFFF',
      lg: '12px 12px 24px #C9C1D4, -12px -12px 24px #FFFFFF',
    },
    // Pressed/inset elements (inputs, pressed buttons)
    neumorphInset: {
      sm: 'inset 2px 2px 4px #C9C1D4, inset -2px -2px 4px #FFFFFF',
      DEFAULT: 'inset 4px 4px 8px #C9C1D4, inset -4px -4px 8px #FFFFFF',
      md: 'inset 6px 6px 12px #C9C1D4, inset -6px -6px 12px #FFFFFF',
    },
    // Flat subtle shadow
    flat: '0 2px 8px rgba(45, 27, 78, 0.08)',
  },

  // Border radius - softer, more rounded for neomorphic
  borderRadius: {
    sm: '8px',
    DEFAULT: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    full: '9999px',
  },

  // Spacing scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    DEFAULT: '200ms ease',
    slow: '300ms ease',
  },
} as const

// Type exports for TypeScript
export type ThemeColors = typeof theme.colors
export type ThemeShadows = typeof theme.shadows
