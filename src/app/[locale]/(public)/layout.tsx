import { PublicHeader, PublicFooter } from '@/components/layout'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600">
      <PublicHeader variant="light" />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter variant="light" />
    </div>
  )
}
