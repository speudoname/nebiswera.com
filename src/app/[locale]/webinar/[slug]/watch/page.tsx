import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { WatchPageClient } from './WatchPageClient'

// Prevent indexing of watch pages - these are private/token-gated content
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params
  const { token } = await searchParams

  // Redirect if no token
  if (!token) {
    redirect(`/${locale}/webinar/${slug}`)
  }

  return <WatchPageClient slug={slug} token={token} locale={locale} />
}
