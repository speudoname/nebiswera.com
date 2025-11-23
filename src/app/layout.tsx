import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nebiswera',
  description: 'Welcome to nebiswera.com',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  metadataBase: new URL('https://www.nebiswera.com'),
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
