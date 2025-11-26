import { CampaignEditor } from '@/components/admin/campaigns/CampaignEditor'

export const metadata = {
  title: 'Edit Campaign - Admin',
  robots: 'noindex',
}

// Disable static generation for this page (Maily.to editor requires client-side rendering)
export const dynamic = 'force-dynamic'

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Edit Campaign</h1>
        <p className="text-text-secondary">Modify your campaign details</p>
      </div>

      <CampaignEditor campaignId={id} />
    </div>
  )
}
