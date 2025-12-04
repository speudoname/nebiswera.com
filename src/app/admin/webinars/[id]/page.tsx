import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { WebinarEditor } from '../components/WebinarEditor'

export const metadata = {
  title: 'Edit Webinar - Admin',
  robots: 'noindex',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditWebinarPage({ params }: PageProps) {
  const { id } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    include: {
      scheduleConfig: true,
    },
  })

  if (!webinar) {
    notFound()
  }

  const initialData = {
    id: webinar.id,
    title: webinar.title,
    slug: webinar.slug,
    description: webinar.description || '',
    language: webinar.language as 'ka' | 'en',
    presenterName: webinar.presenterName || '',
    presenterTitle: webinar.presenterTitle || '',
    presenterBio: webinar.presenterBio || '',
    presenterAvatar: webinar.presenterAvatar || '',
    customThankYouPageHtml: webinar.customThankYouPageHtml || '',
    timezone: webinar.timezone,
    completionPercent: webinar.completionPercent,
    status: webinar.status,
    videoDuration: webinar.videoDuration || undefined,
    thumbnailUrl: webinar.thumbnailUrl || undefined,
    hlsUrl: webinar.hlsUrl || undefined,
    videoStatus: webinar.videoStatus || undefined,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Edit Webinar</h1>
        <p className="text-text-secondary">Update webinar settings, video, and interactions</p>
      </div>

      <WebinarEditor webinarId={id} initialData={initialData} />
    </div>
  )
}
