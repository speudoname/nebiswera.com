import type { Config } from 'tailwindcss'

/**
 * Tailwind Configuration
 *
 * This file extends Tailwind with our design system tokens.
 * Design tokens are defined in this file.
 *
 * DO NOT add inline colors, fonts, or sizes in components.
 * All values should reference the tokens defined here.
 */

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@maily-to/core/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // =======================================================================
      // COLORS - Limited palette (5 colors + black/white)
      // =======================================================================
      colors: {
        // Primary - Coral/Orange (#F27059) - CTAs, buttons, links, warnings
        primary: {
          50: '#FEF3F1',
          100: '#FDE7E3',
          200: '#FBCFC7',
          300: '#F7A99B',
          400: '#F58A78',
          500: '#F27059',
          600: '#E04D36',
          700: '#BC3A26',
          800: '#9B3324',
          900: '#812F24',
        },
        // Secondary - Orchid/Magenta (#CC7EB8) - Secondary actions, success
        secondary: {
          50: '#FCF5FA',
          100: '#F9EBF5',
          200: '#F3D7EB',
          300: '#E9B8DA',
          400: '#DB94C5',
          500: '#CC7EB8',
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
          700: '#6B2D5C',
          800: '#5A274D',
          900: '#4D2342',
        },
        // Neomorphic surface colors (Subtle off-white #F7F6F8)
        // NOTE: shadow color #B8B4BD must match boxShadow definitions below
        neu: {
          base: '#F7F6F8',
          light: '#FFFFFF',
          dark: '#E8E6EB',
          shadow: '#B8B4BD',
        },
        // Text colors (Dark Purple #4A3060)
        text: {
          primary: '#4A3060',
          secondary: '#6B2D5C',
          muted: '#9E7A92',
        },
      },

      // =======================================================================
      // SHADOWS - Neomorphic (neutral gray-based)
      // =======================================================================
      boxShadow: {
        // =====================================================================
        // Light background shadows (use on neu-base #F7F6F8)
        // =====================================================================
        // Raised elements - Dark shadow #B8B4BD for better contrast
        'neu-sm': '4px 4px 8px #B8B4BD, -4px -4px 8px #FFFFFF',
        'neu': '6px 6px 12px #B8B4BD, -6px -6px 12px #FFFFFF',
        'neu-md': '8px 8px 16px #B8B4BD, -8px -8px 16px #FFFFFF',
        'neu-lg': '12px 12px 24px #B8B4BD, -12px -12px 24px #FFFFFF',
        // Pressed/inset elements
        'neu-inset-sm': 'inset 2px 2px 4px #B8B4BD, inset -2px -2px 4px #FFFFFF',
        'neu-inset': 'inset 4px 4px 8px #B8B4BD, inset -4px -4px 8px #FFFFFF',
        'neu-inset-md': 'inset 6px 6px 12px #B8B4BD, inset -6px -6px 12px #FFFFFF',
        // Flat shadow
        'neu-flat': '0 2px 8px rgba(74, 48, 96, 0.12)',
        // Hover state
        'neu-hover': '8px 8px 16px #B8B4BD, -8px -8px 16px #FFFFFF',
        // Active/pressed state
        'neu-pressed': 'inset 4px 4px 8px #B8B4BD, inset -4px -4px 8px #FFFFFF',

        // =====================================================================
        // Dark/colored background shadows (use on gradients, dark surfaces)
        // Named 'darkbg' to avoid conflict with neu.dark color token
        // Uses subtle opacity instead of pure white for highlight
        // =====================================================================
        'neu-darkbg-sm': '4px 4px 8px rgba(0, 0, 0, 0.25), -4px -4px 8px rgba(255, 255, 255, 0.05)',
        'neu-darkbg': '6px 6px 12px rgba(0, 0, 0, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.05)',
        'neu-darkbg-md': '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.05)',
        'neu-darkbg-lg': '12px 12px 24px rgba(0, 0, 0, 0.35), -12px -12px 24px rgba(255, 255, 255, 0.05)',
        // Pressed/inset for dark backgrounds
        'neu-darkbg-inset-sm': 'inset 2px 2px 4px rgba(0, 0, 0, 0.25), inset -2px -2px 4px rgba(255, 255, 255, 0.05)',
        'neu-darkbg-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.25), inset -4px -4px 8px rgba(255, 255, 255, 0.05)',
        // Hover state for dark backgrounds
        'neu-darkbg-hover': '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.08)',
        // Active/pressed state for dark backgrounds
        'neu-darkbg-pressed': 'inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.05)',
      },

      // =======================================================================
      // BORDER RADIUS - Softer for neomorphic
      // =======================================================================
      borderRadius: {
        'neu-sm': '8px',
        'neu': '12px',
        'neu-md': '16px',
        'neu-lg': '20px',
      },

      // =======================================================================
      // FONTS
      // =======================================================================
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-georgian)', 'system-ui', 'sans-serif'],
        georgian: ['var(--font-georgian)', 'system-ui', 'sans-serif'],
      },

      // =======================================================================
      // TYPOGRAPHY - Line heights for better readability
      // =======================================================================
      lineHeight: {
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
      },

      // =======================================================================
      // LETTER SPACING
      // =======================================================================
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      // =======================================================================
      // ANIMATIONS
      // =======================================================================
      keyframes: {
        flash: {
          '0%': { opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        flash: 'flash 200ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
