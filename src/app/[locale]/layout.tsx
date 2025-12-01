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
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'optional',
  preload: true,
})

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-georgian',
  display: 'optional',
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
        {/* CRITICAL: Preconnect hints MUST be first for optimal performance */}
        {/* Bunny CDN video - 380ms savings for LCP element */}
        <link rel="preconnect" href="https://vz-1693fee0-2ad.b-cdn.net" crossOrigin="" />
        {/* Bunny CDN images & static files */}
        <link rel="preconnect" href="https://nebiswera-cdn.b-cdn.net" crossOrigin="" />

        {/* DNS prefetch fallback for older browsers */}
        <link rel="dns-prefetch" href="https://vz-1693fee0-2ad.b-cdn.net" />
        <link rel="dns-prefetch" href="https://nebiswera-cdn.b-cdn.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* Preload hero poster for LCP - this is the largest contentful paint element */}
        <link
          rel="preload"
          as="image"
          href="https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/thumbnail_8f42b11e.jpg"
          fetchPriority="high"
        />

        {/* Preload critical fonts - Latin (primary) */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/e4af272ccee01ff0-s.p.woff2"
          crossOrigin=""
        />

        {/* Critical CSS for instant LCP - NO Tailwind dependency for above-fold content */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Font Definitions - Inlined to avoid render-blocking request */
          @font-face{font-family:__Inter_1b85de;font-style:normal;font-weight:100 900;font-display:optional;src:url(/_next/static/media/e4af272ccee01ff0-s.p.woff2) format("woff2");unicode-range:u+00??,u+0131,u+0152-0153,u+02bb-02bc,u+02c6,u+02da,u+02dc,u+0304,u+0308,u+0329,u+2000-206f,u+20ac,u+2122,u+2191,u+2193,u+2212,u+2215,u+feff,u+fffd}
          @font-face{font-family:__Inter_Fallback_1b85de;src:local("Arial");ascent-override:90.49%;descent-override:22.56%;line-gap-override:0.00%;size-adjust:107.06%}


          /* Hero Section Layout - Natural content height */
          .hero-section{padding:2rem 0.5rem 3rem;background:linear-gradient(to bottom,#F0EBF8,#E8E0F0);display:flex;align-items:center}
          @media(min-width:768px){.hero-section{padding:3rem 2rem 4rem}}
          .hero-container{display:flex;align-items:center;justify-content:center;width:100%}
          .hero-content{text-align:center;max-width:48rem;width:100%;padding:0 0.5rem}

          /* Hero Typography - Bold and commanding */
          .hero-eyebrow{font-size:1rem;text-transform:uppercase;margin-bottom:0.75rem;font-weight:500}
          .hero-eyebrow:lang(en){letter-spacing:0.05em}
          @media(min-width:768px){.hero-eyebrow{font-size:1.25rem;margin-bottom:1rem}}
          @media(min-width:1024px){.hero-eyebrow{font-size:1.375rem}}
          .hero-title{font-size:3.25rem;line-height:1.1;font-weight:800;margin-bottom:1rem;letter-spacing:-0.025em}
          @media(min-width:640px){.hero-title{font-size:3.5rem}}
          @media(min-width:768px){.hero-title{font-size:4.5rem;margin-bottom:1.25rem}}
          @media(min-width:1024px){.hero-title{font-size:5rem}}
          @media(min-width:1280px){.hero-title{font-size:5.5rem}}
          .hero-subtitle{font-size:1.375rem;line-height:1.35;color:#6B2D5C;margin-bottom:1.25rem}
          @media(min-width:768px){.hero-subtitle{font-size:1.75rem;margin-bottom:1.5rem}}
          @media(min-width:1024px){.hero-subtitle{font-size:1.875rem}}

          /* Color Utilities - Brand coral/orange for consistency with buttons */
          .text-primary{color:#F27059}
          .text-secondary{color:#6B2D5C}
          .text-dark{color:#2D1B4E}

          /* Hero Video Container - Maintains 16:9 aspect ratio */
          .hero-video-container{position:relative;width:100%;max-width:48rem;margin:2.5rem auto 1rem;aspect-ratio:16/9;height:auto;border-radius:1rem;overflow:hidden;box-shadow:6px 6px 12px #B8B4BD,-6px -6px 12px #FFFFFF}
          @media(min-width:768px){.hero-video-container{margin-top:3rem;margin-bottom:1.5rem}}
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
      <body className={`${inter.variable} ${notoSansGeorgian.variable} ${locale === 'ka' ? 'font-georgian' : 'font-sans'}`}>
        {/* Google Analytics - Delayed loading for better performance */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
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
