import { generatePageMetadata } from '@/lib/metadata'
import { UnsubscribeClient } from './UnsubscribeClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // Use a generic page metadata - unsubscribe pages shouldn't be indexed
  return {
    ...await generatePageMetadata('home', locale),
    robots: { index: false, follow: false },
    title: locale === 'ka' ? 'გამოწერის გაუქმება - ნებისწერა' : 'Unsubscribe - Nebiswera',
  }
}

export default function UnsubscribePage() {
  return <UnsubscribeClient />
}
