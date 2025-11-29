import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { AutomationEditor } from './AutomationEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AutomationPage({ params }: PageProps) {
  const { id } = await params

  const [webinar, notifications, automationRules, tags] = await Promise.all([
    prisma.webinar.findUnique({
      where: { id },
      select: { id: true, title: true },
    }),
    prisma.webinarNotification.findMany({
      where: { webinarId: id },
      orderBy: { type: 'asc' },
    }),
    prisma.webinarAutomationRule.findMany({
      where: { webinarId: id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    }),
  ])

  if (!webinar) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Automation</h1>
          <p className="text-text-secondary">{webinar.title}</p>
        </div>
        <a
          href={`/admin/webinars/${id}`}
          className="text-primary-500 hover:text-primary-600"
        >
          &larr; Back to webinar
        </a>
      </div>

      <AutomationEditor
        webinarId={id}
        webinarTitle={webinar.title}
        initialNotifications={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          trigger: n.trigger,
          triggerMinutes: n.triggerMinutes,
          subject: n.subject,
          bodyHtml: n.bodyHtml,
          bodyText: n.bodyText || '',
          enabled: n.enabled,
        }))}
        initialAutomationRules={automationRules.map((r) => ({
          id: r.id,
          trigger: r.trigger,
          tagIds: r.tagIds,
          enabled: r.enabled,
          createdAt: r.createdAt.toISOString(),
        }))}
        availableTags={tags}
      />
    </div>
  )
}
