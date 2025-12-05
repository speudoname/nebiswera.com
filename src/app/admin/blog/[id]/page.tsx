import { BlogPostEditor } from '../BlogPostEditor'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Edit Blog Post - Admin',
  robots: 'noindex',
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const post = await prisma.blogPost.findUnique({
    where: { id },
  })

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Edit Blog Post</h1>
        <p className="text-text-secondary">Edit your article</p>
      </div>

      <BlogPostEditor post={post} />
    </div>
  )
}
