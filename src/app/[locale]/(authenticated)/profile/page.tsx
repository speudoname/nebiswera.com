import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { ProfileClient } from './components/ProfileClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('profile', locale)
}

export default function ProfilePage() {
  return <ProfileClient />
}
