export default function InteractionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full-screen layout without admin sidebar
  return (
    <div className="min-h-screen bg-neu-base">
      {children}
    </div>
  )
}
