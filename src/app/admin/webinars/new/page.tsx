import { WebinarEditor } from '../components/WebinarEditor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'New Webinar - Admin',
  robots: 'noindex',
}

export default function NewWebinarPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create New Webinar</h1>
        <p className="text-text-secondary">Set up your webinar with video, schedule, and interactions</p>
      </div>

      <WebinarEditor />
    </div>
  )
}
