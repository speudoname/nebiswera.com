import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { AnalyticsDashboard } from './AnalyticsDashboard'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WebinarAnalyticsPage({ params }: PageProps) {
  const { id } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  })

  if (!webinar) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-secondary">{webinar.title}</p>
        </div>
        <a
          href={`/admin/webinars/${id}`}
          className="text-primary-500 hover:text-primary-600"
        >
          &larr; Back to webinar
        </a>
      </div>

      <AnalyticsDashboard webinarId={id} />
    </div>
  )
}
