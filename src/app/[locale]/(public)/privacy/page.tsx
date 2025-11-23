import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'

export default async function PrivacyPage() {
  const t = await getTranslations('pages.privacy')

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
