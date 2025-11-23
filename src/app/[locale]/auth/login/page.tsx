import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { LoginClient } from './LoginClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('login', locale)
}

export default function LoginPage() {
  return <LoginClient />
}
