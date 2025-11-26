import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { NotificationsEditor } from './NotificationsEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NotificationsPage({ params }: PageProps) {
  const { id } = await params

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    include: {
      notifications: {
        orderBy: { type: 'asc' },
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
          <h1 className="text-2xl font-bold text-text-primary">Email Notifications</h1>
          <p className="text-text-secondary">{webinar.title}</p>
        </div>
        <a
          href={`/admin/webinars/${id}`}
          className="text-primary-500 hover:text-primary-600"
        >
          &larr; Back to webinar
        </a>
      </div>

      <NotificationsEditor
        webinarId={id}
        webinarTitle={webinar.title}
        initialNotifications={webinar.notifications.map((n) => ({
          id: n.id,
          type: n.type,
          trigger: n.trigger,
          triggerMinutes: n.triggerMinutes,
          subject: n.subject,
          bodyHtml: n.bodyHtml,
          bodyText: n.bodyText,
          enabled: n.enabled,
        }))}
      />
    </div>
  )
}
