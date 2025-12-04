import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ThankYouClient } from './ThankYouClient'

// Prevent indexing of thank-you pages - these are private/token-gated content
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
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    token?: string
  }>
}

export default async function ThankYouPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  return <ThankYouClient slug={slug} token={token} locale={locale} />
}
