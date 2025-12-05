import { BlogPostEditor } from '../BlogPostEditor'

export const metadata = {
  title: 'New Blog Post - Admin',
  robots: 'noindex',
}

export default function NewBlogPostPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">New Blog Post</h1>
        <p className="text-text-secondary">Create a new article for your blog</p>
      </div>

      <BlogPostEditor />
    </div>
  )
}
