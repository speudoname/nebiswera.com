import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { HomeClient } from './HomeClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('home', locale)
}

export default function HomePage() {
  return <HomeClient />
}
