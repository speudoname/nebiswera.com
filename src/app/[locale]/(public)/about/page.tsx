import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('about', locale)
}

export default async function AboutPage() {
  const t = await getTranslations('pages.about')

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card padding="lg">
        <h1>{t('title')}</h1>
        <p className="text-text-secondary">
          {t('content')}
        </p>
      </Card>
    </div>
  )
}
