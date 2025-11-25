import { Card } from '@/components/ui/Card'
import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { PrivacyContent } from './content/PrivacyContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('privacy', locale)
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <Card padding="md" className="md:p-8">
        <PrivacyContent />
      </Card>
    </div>
  )
}
