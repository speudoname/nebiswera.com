import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { VerifyRequiredClient } from './VerifyRequiredClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('verifyRequired', locale)
}

export default function VerifyRequiredPage() {
  return <VerifyRequiredClient />
}
