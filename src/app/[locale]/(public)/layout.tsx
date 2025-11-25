import { PublicHeader, PublicFooter } from '@/components/layout'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  let user = null
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
      },
    })
    user = dbUser
  }

  return (
    <div className="min-h-screen flex flex-col bg-neu-base">
      <PublicHeader user={user} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
