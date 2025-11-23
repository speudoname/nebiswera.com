import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { VerifyEmailClient } from './VerifyEmailClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('verifyEmail', locale)
}

export default function VerifyEmailPage() {
  return <VerifyEmailClient />
}
