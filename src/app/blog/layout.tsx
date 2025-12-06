import { Inter, Noto_Sans_Georgian } from 'next/font/google'
import '../globals.css'
import { AnalyticsProvider } from '@/providers/AnalyticsProvider'
import { FacebookPixel } from '@/components/analytics/FacebookPixel'

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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ka">
      <head>
        <link rel="preconnect" href="https://nebiswera-cdn.b-cdn.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://nebiswera-cdn.b-cdn.net" />
      </head>
      <body className={`${inter.variable} ${notoSansGeorgian.variable} font-georgian`}>
        <FacebookPixel />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}
