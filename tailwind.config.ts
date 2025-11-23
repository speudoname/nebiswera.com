import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors - Limited palette (5 colors only + black/white)
      colors: {
        // Primary - Coral/Orange (#F27059)
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
        // Secondary - Orchid/Magenta (#CC7EB8)
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
        // Deep Purple accent (#6B2D5C)
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
        // Neomorphic surface colors (Light Pink base #FFCCE5)
        neu: {
          base: '#FFCCE5',
          light: '#FFE0F0',
          dark: '#F0B8D6',
          shadow: '#D9A3C2',
          highlight: '#FFFFFF',
        },
        // Text colors (Dark Purple)
        text: {
          primary: '#4A3060',
          secondary: '#6B2D5C',
          muted: '#9E7A92',
        },
      },
      // Neomorphic shadows (updated to pink-based)
      boxShadow: {
        // Raised elements
        'neu-sm': '4px 4px 8px #D9A3C2, -4px -4px 8px #FFFFFF',
        'neu': '6px 6px 12px #D9A3C2, -6px -6px 12px #FFFFFF',
        'neu-md': '8px 8px 16px #D9A3C2, -8px -8px 16px #FFFFFF',
        'neu-lg': '12px 12px 24px #D9A3C2, -12px -12px 24px #FFFFFF',
        // Pressed/inset elements
        'neu-inset-sm': 'inset 2px 2px 4px #D9A3C2, inset -2px -2px 4px #FFFFFF',
        'neu-inset': 'inset 4px 4px 8px #D9A3C2, inset -4px -4px 8px #FFFFFF',
        'neu-inset-md': 'inset 6px 6px 12px #D9A3C2, inset -6px -6px 12px #FFFFFF',
        // Flat shadow
        'neu-flat': '0 2px 8px rgba(74, 48, 96, 0.08)',
        // Hover state - slightly more pronounced
        'neu-hover': '8px 8px 16px #D9A3C2, -8px -8px 16px #FFFFFF',
        // Active/pressed state
        'neu-pressed': 'inset 4px 4px 8px #D9A3C2, inset -4px -4px 8px #FFFFFF',
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
        'neu-gradient': 'linear-gradient(145deg, #FFE0F0, #F0C0D8)',
        'neu-gradient-reverse': 'linear-gradient(145deg, #F0C0D8, #FFE0F0)',
      },
      // Font family (using CSS variables from next/font)
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-georgian)', 'system-ui', 'sans-serif'],
        georgian: ['var(--font-georgian)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
