import { Suspense } from 'react'
import { BlogPostsTable } from './BlogPostsTable'

export const metadata = {
  title: 'Blog Posts - Admin',
  robots: 'noindex',
}

export default function AdminBlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Blog Posts</h1>
        <p className="text-text-secondary">Create and manage blog posts</p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading posts...</div>}>
        <BlogPostsTable />
      </Suspense>
    </div>
  )
}
