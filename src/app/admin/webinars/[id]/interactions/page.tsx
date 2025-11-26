import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { InteractionsEditor } from './InteractionsEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InteractionsPage({ params }: PageProps) {
  const { id } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { triggersAt: 'asc' },
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
          <h1 className="text-2xl font-bold text-text-primary">Interactions</h1>
          <p className="text-text-secondary">{webinar.title}</p>
        </div>
        <a
          href={`/admin/webinars/${id}`}
          className="text-primary-500 hover:text-primary-600"
        >
          &larr; Back to webinar
        </a>
      </div>

      <InteractionsEditor
        webinarId={id}
        videoDuration={webinar.videoDuration || 3600}
        videoUid={webinar.cloudflareVideoUid || ''}
        initialInteractions={webinar.interactions.map((i) => ({
          id: i.id,
          type: i.type,
          triggerTime: i.triggersAt,
          duration: i.duration,
          title: i.title,
          config: i.content as Record<string, unknown>,
          pauseVideo: i.pauseVideo,
          required: i.required,
          showOnReplay: i.showOnReplay,
          position: i.position,
          enabled: i.enabled,
        }))}
      />
    </div>
  )
}
