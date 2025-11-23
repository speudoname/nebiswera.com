import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { signOutAction } from '@/lib/actions'
import { AppHeader } from '@/components/layout'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
    },
  })

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="min-h-screen bg-neu-base">
      <AppHeader user={{ name: user.name, email: user.email, image: user.image, role: user.role }} signOutAction={signOutAction} />
      <main>
        {children}
      </main>
    </div>
  )
}
