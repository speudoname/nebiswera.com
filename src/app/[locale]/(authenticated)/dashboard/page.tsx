import { getLocale, getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { Badge, IconBadge } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { BookOpen, CheckCircle, ShoppingBag } from 'lucide-react'

export default async function DashboardPage() {
  const locale = await getLocale()
  const t = await getTranslations('dashboard')
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { email: session!.user!.email! },
    select: {
      email: true,
      name: true,
      emailVerified: true,
      emailVerificationSentAt: true,
    },
  })

  const welcomeMessage = user?.name
    ? t('welcome', { name: user.name })
    : t('welcomeDefault')

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        {user && !user.emailVerified && (
          <EmailVerificationBanner
            email={user.email}
            verificationSentAt={user.emailVerificationSentAt}
          />
        )}

        <Card padding="lg">
          <h1 className="mb-4">
            {welcomeMessage}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            {user?.emailVerified ? (
              <Badge variant="success">{t('emailVerified')}</Badge>
            ) : (
              <Badge variant="warning">{t('emailPending')}</Badge>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card variant="flat" className="bg-primary-50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconBadge icon={BookOpen} size="sm" variant="primary" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-body-sm font-medium text-secondary truncate">
                        {t('myCourses')}
                      </dt>
                      <dd className="text-lg font-medium">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-secondary-50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconBadge icon={CheckCircle} size="sm" variant="secondary" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-body-sm font-medium text-secondary truncate">
                        {t('completed')}
                      </dt>
                      <dd className="text-lg font-medium">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-secondary-50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconBadge icon={ShoppingBag} size="sm" variant="secondary" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-body-sm font-medium text-secondary truncate">
                        {t('purchases')}
                      </dt>
                      <dd className="text-lg font-medium">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  )
}
