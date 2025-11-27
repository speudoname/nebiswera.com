import { Inter, Noto_Sans_Georgian } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { SessionProvider } from '@/providers/SessionProvider'
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/metadata'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  variable: '--font-georgian',
  display: 'swap',
  preload: true,
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming locale is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Get messages for the current locale
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        {/* Preconnect to CDN for faster resource loading */}
        <link rel="preconnect" href="https://cdn.nebiswera.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.nebiswera.com" />

        {/* Preconnect to Mux for webinar thumbnails */}
        <link rel="preconnect" href="https://image.mux.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
        <link rel="preconnect" href="https://stream.mux.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />

        {/* Preload hero video poster for LCP optimization */}
        <link
          rel="preload"
          as="image"
          href="https://cdn.nebiswera.com/hero-video-poster.jpg"
          fetchPriority="high"
        />

        {/* Inline critical CSS for immediate render */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Critical CSS - Above the fold */
          :root {
            --font-inter: ${inter.style.fontFamily};
            --font-georgian: ${notoSansGeorgian.style.fontFamily};
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: var(--font-inter), var(--font-georgian), system-ui, sans-serif;
            background-color: #F7F6F8;
            color: #4A3060;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Hero section critical styles */
          .hero-title {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 700;
            line-height: 1.2;
          }

          .hero-subtitle {
            font-size: clamp(1.125rem, 2.5vw, 1.5rem);
            line-height: 1.5;
            color: #6B2D5C;
          }

          .eyebrow {
            font-size: clamp(0.875rem, 1.5vw, 1rem);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          /* Prevent layout shift for video */
          .aspect-video {
            aspect-ratio: 16 / 9;
          }
        `}} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema(locale)),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebSiteSchema(locale)),
          }}
        />
      </head>
      <body className={`${inter.variable} ${notoSansGeorgian.variable} font-sans`}>
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
