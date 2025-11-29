import { Inter, Noto_Sans_Georgian } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { locales, type Locale } from '@/i18n/config'
import { SessionProvider } from '@/providers/SessionProvider'
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/metadata'

const GA_MEASUREMENT_ID = 'G-W670GS5SSX'

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
        {/* Preconnect to CDNs for faster resource loading */}
        <link rel="preconnect" href="https://cdn.nebiswera.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.nebiswera.com" />
        {/* Bunny.net video CDN - critical for LCP on home page */}
        <link rel="preconnect" href="https://vz-1693fee0-2ad.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vz-1693fee0-2ad.b-cdn.net" />

        {/* Preload hero poster for LCP - this is the largest contentful paint element */}
        <link
          rel="preload"
          as="image"
          href="https://cdn.nebiswera.com/hero/video-poster.jpg"
          fetchPriority="high"
        />

        {/* Critical CSS for LCP - ONLY hero section styles, no Tailwind conflicts */}
        <style dangerouslySetInnerHTML={{__html: `
          .hero-video-container{position:relative;width:100%;max-width:36rem;margin:0 auto;aspect-ratio:16/9;border-radius:1rem;overflow:hidden}
          .hero-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
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
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
