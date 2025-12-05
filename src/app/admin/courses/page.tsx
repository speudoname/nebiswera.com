import { Suspense } from 'react'
import { CoursesTable } from './CoursesTable'

export const metadata = {
  title: 'Courses - Admin',
  robots: 'noindex',
}

export default function AdminCoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Courses</h1>
        <p className="text-text-secondary">Create and manage online courses</p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading courses...</div>}>
        <CoursesTable />
      </Suspense>
    </div>
  )
}
