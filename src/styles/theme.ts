/**
 * Nebiswera Design System - Theme Configuration
 *
 * Limited color palette (5 colors + black/white):
 * - Light Pink (#FFCCE5) - Background/Surface
 * - Orchid (#CC7EB8) - Secondary
 * - Deep Purple (#6B2D5C) - Accent/Text Secondary
 * - Coral (#F27059) - Primary/CTA
 * - Dark Purple (#4A3060) - Text Primary
 */

export const theme = {
  colors: {
    // Primary - Coral/Orange (#F27059) - CTAs, buttons, links
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
    // Secondary - Orchid/Magenta (#CC7EB8) - Secondary actions, badges
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
    // Accent - Deep Purple (#6B2D5C)
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
    // Neomorphic background colors (Light Pink #FFCCE5)
    background: {
      base: '#FFCCE5',      // Main background
      elevated: '#FFE0F0',   // Lighter for elevated elements
      sunken: '#F0B8D6',     // Darker for pressed/inset states
    },
    // Surface colors for cards and containers
    surface: {
      DEFAULT: '#FFCCE5',
      light: '#FFE0F0',
      dark: '#F0B8D6',
    },
    // Text colors (Dark Purple #4A3060)
    text: {
      primary: '#4A3060',    // Main text
      secondary: '#6B2D5C',  // Secondary text (Deep Purple)
      muted: '#9E7A92',      // Muted text
      inverse: '#FFFFFF',    // White for dark backgrounds
    },
    // Semantic colors mapped to palette
    semantic: {
      success: '#CC7EB8',    // Secondary (Orchid)
      warning: '#F27059',    // Primary (Coral)
      error: '#E04D36',      // Primary dark
      info: '#6B2D5C',       // Accent (Deep Purple)
    },
  },

  // Neomorphic shadows (pink-based)
  shadows: {
    // Raised elements (buttons, cards)
    neumorph: {
      sm: '4px 4px 8px #D9A3C2, -4px -4px 8px #FFFFFF',
      DEFAULT: '6px 6px 12px #D9A3C2, -6px -6px 12px #FFFFFF',
      md: '8px 8px 16px #D9A3C2, -8px -8px 16px #FFFFFF',
      lg: '12px 12px 24px #D9A3C2, -12px -12px 24px #FFFFFF',
    },
    // Pressed/inset elements (inputs, pressed buttons)
    neumorphInset: {
      sm: 'inset 2px 2px 4px #D9A3C2, inset -2px -2px 4px #FFFFFF',
      DEFAULT: 'inset 4px 4px 8px #D9A3C2, inset -4px -4px 8px #FFFFFF',
      md: 'inset 6px 6px 12px #D9A3C2, inset -6px -6px 12px #FFFFFF',
    },
    // Flat subtle shadow
    flat: '0 2px 8px rgba(74, 48, 96, 0.08)',
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
      sans: ['Inter', 'Noto Sans Georgian', 'system-ui', 'sans-serif'],
      georgian: ['Noto Sans Georgian', 'system-ui', 'sans-serif'],
      display: ['Inter', 'Noto Sans Georgian', 'system-ui', 'sans-serif'],
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
