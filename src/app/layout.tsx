import type { Metadata, Viewport } from 'next'
import './globals.css'
import { seoConfig } from '@/config/seo'

// Import default locale SEO content for fallback metadata
// This is only used if page-specific metadata fails to load
import seoContent from '../../content/seo/ka.json'

export const metadata: Metadata = {
  title: {
    default: seoContent.site.name,
    template: '%s', // Pages provide full titles, no suffix needed
  },
  // Fallback description from default locale (Georgian) SEO content
  // Individual pages override this with locale-specific content via generatePageMetadata()
  description: seoContent.pages.home.description,
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
