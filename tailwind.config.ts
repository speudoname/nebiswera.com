import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors - Purple/Lavender Neomorphic Palette
      colors: {
        // Primary purple
        primary: {
          50: '#F5F0FF',
          100: '#EBE0FF',
          200: '#D4C4F9',
          300: '#B8A1E8',
          400: '#9D7FD9',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Secondary lavender
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
        // Neomorphic surface colors
        neu: {
          base: '#E8E0F0',
          light: '#F0E8F8',
          dark: '#DED6E8',
          shadow: '#C9C1D4',
          highlight: '#FFFFFF',
        },
        // Text colors
        text: {
          primary: '#2D1B4E',
          secondary: '#5B4478',
          muted: '#8B7AA0',
        },
      },
      // Neomorphic shadows
      boxShadow: {
        // Raised elements
        'neu-sm': '4px 4px 8px #C9C1D4, -4px -4px 8px #FFFFFF',
        'neu': '6px 6px 12px #C9C1D4, -6px -6px 12px #FFFFFF',
        'neu-md': '8px 8px 16px #C9C1D4, -8px -8px 16px #FFFFFF',
        'neu-lg': '12px 12px 24px #C9C1D4, -12px -12px 24px #FFFFFF',
        // Pressed/inset elements
        'neu-inset-sm': 'inset 2px 2px 4px #C9C1D4, inset -2px -2px 4px #FFFFFF',
        'neu-inset': 'inset 4px 4px 8px #C9C1D4, inset -4px -4px 8px #FFFFFF',
        'neu-inset-md': 'inset 6px 6px 12px #C9C1D4, inset -6px -6px 12px #FFFFFF',
        // Flat shadow
        'neu-flat': '0 2px 8px rgba(45, 27, 78, 0.08)',
        // Hover state - slightly more pronounced
        'neu-hover': '8px 8px 16px #C9C1D4, -8px -8px 16px #FFFFFF',
        // Active/pressed state
        'neu-pressed': 'inset 4px 4px 8px #C9C1D4, inset -4px -4px 8px #FFFFFF',
      },
      // Border radius - softer for neomorphic
      borderRadius: {
        'neu-sm': '8px',
        'neu': '12px',
        'neu-md': '16px',
        'neu-lg': '20px',
        'neu-xl': '24px',
      },
      // Background gradients
      backgroundImage: {
        'neu-gradient': 'linear-gradient(145deg, #F0E8F8, #E0D8E8)',
        'neu-gradient-reverse': 'linear-gradient(145deg, #E0D8E8, #F0E8F8)',
      },
      // Font family
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
