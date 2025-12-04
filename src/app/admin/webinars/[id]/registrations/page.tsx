import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { RegistrationsTable } from './RegistrationsTable'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WebinarRegistrationsPage({ params }: PageProps) {
  const { id } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  })

  if (!webinar) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Registrations</h1>
          <p className="text-text-secondary">
            {webinar.title} - {webinar._count.registrations} registrant{webinar._count.registrations !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/admin/webinars"
          className="text-primary-500 hover:text-primary-600"
        >
          &larr; Back to webinars
        </a>
      </div>

      <RegistrationsTable webinarId={id} />
    </div>
  )
}
