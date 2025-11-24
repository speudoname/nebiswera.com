// Admin Testimonial Detail/Edit Page
import { TestimonialEditForm } from './TestimonialEditForm'

export const metadata = {
  title: 'Edit Testimonial - Admin',
  robots: 'noindex',
}

export default async function TestimonialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Edit Testimonial</h1>
        <p className="text-text-secondary">View and edit testimonial details</p>
      </div>

      <TestimonialEditForm id={id} />
    </div>
  )
}
