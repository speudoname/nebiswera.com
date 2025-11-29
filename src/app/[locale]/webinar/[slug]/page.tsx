import { notFound } from 'next/navigation'
import { WebinarLandingClient } from './WebinarLandingClient'
import { prisma } from '@/lib/db'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export default async function WebinarLandingPage({ params }: PageProps) {
  const { locale, slug } = await params

  // Fetch webinar data
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      presenterName: true,
      presenterTitle: true,
      presenterBio: true,
      presenterAvatar: true,
      thumbnailUrl: true,
      status: true,
      scheduleConfig: true,
    },
  })

  // If webinar doesn't exist or is not published, show 404
  if (!webinar || webinar.status !== 'PUBLISHED') {
    notFound()
  }

  return (
    <WebinarLandingClient
      webinar={webinar}
      slug={slug}
      locale={locale}
    />
  )
}
