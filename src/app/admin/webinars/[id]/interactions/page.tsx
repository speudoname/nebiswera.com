import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { InteractionsEditorFullScreen } from './InteractionsEditorFullScreen'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InteractionsPage({ params }: PageProps) {
  const { id } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      videoDuration: true,
      hlsUrl: true,
      interactions: {
        orderBy: { triggersAt: 'asc' },
      },
    },
  })

  if (!webinar) {
    notFound()
  }

  return (
    <div className="h-screen flex flex-col bg-neu-base overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b border-neu-dark bg-white px-4 py-2.5">
        <Link
          href={`/admin/webinars/${id}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Full Screen Editor */}
      <div className="flex-1 min-h-0">
        <InteractionsEditorFullScreen
          webinarId={id}
          videoUrl={webinar.hlsUrl || ''}
          videoDuration={webinar.videoDuration || 3600}
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
    </div>
  )
}
