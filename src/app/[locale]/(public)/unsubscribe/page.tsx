import { generatePageMetadata } from '@/lib/metadata'
import { UnsubscribeClient } from './UnsubscribeClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return generatePageMetadata('unsubscribe', locale)
}

export default function UnsubscribePage() {
  return <UnsubscribeClient />
}
