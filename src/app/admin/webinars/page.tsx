import { Suspense } from 'react'
import { WebinarsTable } from './WebinarsTable'

export const metadata = {
  title: 'Webinars - Admin',
  robots: 'noindex',
}

export default function AdminWebinarsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Webinars</h1>
        <p className="text-text-secondary">Create and manage webinars for your audience</p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading webinars...</div>}>
        <WebinarsTable />
      </Suspense>
    </div>
  )
}
