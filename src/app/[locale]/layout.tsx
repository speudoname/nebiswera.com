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

        {/* Preload critical fonts to avoid render-blocking chain */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/e889be32d4886456-s.woff2"
          crossOrigin="anonymous"
        />

        {/* Critical CSS for instant LCP - NO Tailwind dependency for above-fold content */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Hero Section Layout */
          .hero-section{padding:1rem 1rem 4rem;background:linear-gradient(to bottom,#F0EBF8,#E8E0F0)}
          @media(min-width:768px){.hero-section{padding:2rem 2rem 6rem}}
          .hero-container{display:flex;align-items:center;justify-content:center;min-height:60vh}
          .hero-content{text-align:center;max-width:48rem;width:100%;padding:0 1rem}

          /* Hero Typography */
          .hero-eyebrow{font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1rem;font-weight:500}
          @media(min-width:768px){.hero-eyebrow{font-size:1rem}}
          .hero-title{font-size:2.5rem;line-height:1.2;font-weight:800;margin-bottom:1rem;letter-spacing:-0.025em}
          @media(min-width:768px){.hero-title{font-size:3rem}}
          .hero-subtitle{font-size:1.25rem;line-height:1.5;color:#6B2D5C;margin-bottom:1.5rem}
          @media(min-width:768px){.hero-subtitle{font-size:1.5rem}}
          @media(min-width:1024px){.hero-subtitle{font-size:1.875rem}}

          /* Color Utilities */
          .text-primary{color:#8B5CF6}
          .text-secondary{color:#5B4478}
          .text-dark{color:#2D1B4E}

          /* Hero Video Container */
          .hero-video-container{position:relative;width:100%;max-width:36rem;margin:0 auto 1.5rem;aspect-ratio:16/9;border-radius:1rem;overflow:hidden;box-shadow:6px 6px 12px #B8B4BD,-6px -6px 12px #FFFFFF}
          @media(min-width:768px){.hero-video-container{margin-bottom:2rem}}
          .hero-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}

          /* Button Base Styles */
          .btn{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;font-weight:500;border-radius:0.75rem;transition:all 0.2s;outline:none;padding:0.875rem 2rem;font-size:1rem;gap:0.625rem}
          .btn:disabled{opacity:0.5;cursor:not-allowed}
          .btn svg{width:1.25rem;height:1.25rem}

          /* Primary Button */
          .btn-primary{background:#F27059;color:#fff;box-shadow:6px 6px 12px #B8B4BD,-6px -6px 12px #FFFFFF}
          .btn-primary:hover{background:#E04D36;box-shadow:8px 8px 16px #B8B4BD,-8px -8px 16px #FFFFFF}
          .btn-primary:active{background:#BC3A26;box-shadow:inset 4px 4px 8px #B8B4BD,inset -4px -4px 8px #FFFFFF}

          /* Secondary Button */
          .btn-secondary{background:#F7F6F8;color:#F27059;border:2px solid #F7A99B;box-shadow:4px 4px 8px #B8B4BD,-4px -4px 8px #FFFFFF}
          .btn-secondary:hover{background:#FEF3F1;border-color:#F58A78;box-shadow:6px 6px 12px #B8B4BD,-6px -6px 12px #FFFFFF}
          .btn-secondary:active{box-shadow:inset 2px 2px 4px #B8B4BD,inset -2px -2px 4px #FFFFFF}

          /* Button Container */
          .hero-buttons{display:flex;flex-direction:column;gap:0.75rem;justify-content:center}
          @media(min-width:640px){.hero-buttons{flex-direction:row;gap:1rem}}
          .hero-buttons a,.hero-buttons button{width:100%}
          @media(min-width:640px){.hero-buttons a,.hero-buttons button{width:auto}}
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
