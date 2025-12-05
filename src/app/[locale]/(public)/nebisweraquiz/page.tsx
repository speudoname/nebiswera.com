import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { TestPageClient } from './TestPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('nebisweraquiz', locale)
}

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ email?: string }>
}) {
  const { locale } = await params
  const { email } = await searchParams

  return <TestPageClient locale={locale} initialEmail={email} />
}
