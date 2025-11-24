// Admin Testimonials List Page
import { Suspense } from 'react'
import { TestimonialsTable } from './TestimonialsTable'

export const metadata = {
  title: 'Testimonials - Admin',
  robots: 'noindex',
}

export default function AdminTestimonialsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Testimonials</h1>
        <p className="text-text-secondary">Manage testimonials from website submissions and imports</p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading testimonials...</div>}>
        <TestimonialsTable />
      </Suspense>
    </div>
  )
}
