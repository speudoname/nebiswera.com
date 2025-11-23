import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { AuthErrorClient } from './AuthErrorClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('authError', locale)
}

export default function AuthErrorPage() {
  return <AuthErrorClient />
}
