// Testimonial Submission Form Page
import { generatePageMetadata } from '@/lib/metadata'
import { CollectLoveMultiStepForm } from './CollectLoveMultiStepForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return generatePageMetadata('collectlove', locale)
}

export default function CollectLovePage() {
  return <CollectLoveMultiStepForm />
}
