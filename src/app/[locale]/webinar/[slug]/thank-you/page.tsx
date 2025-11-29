import { notFound } from 'next/navigation'
import { ThankYouClient } from './ThankYouClient'

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
