import type { Metadata, Viewport } from 'next'
import './globals.css'
import { seoConfig } from '@/config/seo'

export const metadata: Metadata = {
  title: {
    default: 'Nebiswera',
    template: '%s', // Pages provide full titles, no suffix needed
  },
  description: 'Learn Georgian language online with interactive lessons and personalized learning paths',
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
  metadataBase: new URL(seoConfig.siteUrl),
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: seoConfig.themeColor,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
