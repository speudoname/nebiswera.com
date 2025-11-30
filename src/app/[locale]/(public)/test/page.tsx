import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { TestPageClient } from './TestPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('test', locale)
}

export default async function TestPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return <TestPageClient locale={locale} />
}
