// Public Testimonials Wall of Love
import { generatePageMetadata } from '@/lib/metadata'
import { LoveWallClient } from './LoveWallClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return generatePageMetadata('love', locale)
}

export default function LovePage() {
  return <LoveWallClient />
}
